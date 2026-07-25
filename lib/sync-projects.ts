// Shared core for syncing the APB projects Google Sheet into the `projects` table.
//
// Kept free of process.argv / console output so it can run in two places:
//   - scripts/sync-projects-from-sheet.ts   (CLI, for ops)
//   - POST /api/projects/sync               (the sheet's Apps Script menu)
//
// This lives here rather than in the backend_migrations submodule because that repo
// is private and this one is public: Vercel can't clone it during a build.
//
// Env: NHOST_SUBDOMAIN, NHOST_REGION, NHOST_GRAPHQL_SECRET.

const SHEET_ID = "1b2R5Qdnx8CwC-TjFKZ-T0DfZij5hE2zoPNKeHlT17Ro";
const SHEET_GID = "1901933999";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const subdomain = process.env.NHOST_SUBDOMAIN;
const region = process.env.NHOST_REGION;
const adminSecret = process.env.NHOST_GRAPHQL_SECRET;

const hasuraBase = `https://${subdomain}.hasura.${region}.nhost.run`;

// ---------------------------------------------------------------------------
// Sheet name -> project_handle
// ---------------------------------------------------------------------------

// Handles that predate the sheet and don't match the slug of their sheet name.
// Keyed by the *slug* of the sheet name so trailing spaces and casing don't matter.
// Without these the sync would insert duplicate rows next to the existing ones and
// orphan their snapshot history.
const HANDLE_OVERRIDES: Record<string, string> = {
  "chicken-nor-egg-social-media": "chicken-nor-egg",
  coffeebuddy: "coffee-buddy",
  "grassroots-social-platform-for-social-good": "grassroots",
  "sanctuary-sim-working-title": "sanctuary-sim",
  "we-the-free-seattle-chapter": "we-the-free-seattle",
  "stickering-in-the-seattle-area": "stickering-seattle",
};

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "") // Vishnu's -> vishnus, not vishnu-s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function handleFor(sheetName: string): string {
  const slug = slugify(sheetName);
  return HANDLE_OVERRIDES[slug] ?? slug;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

// RFC 4180. Cells in this sheet contain commas *and* newlines, so splitting on
// delimiters isn't an option.
function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch; // newlines inside quotes are content
      }
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Headers are long and prose-y ("Impact (obviously this is a snapshot, ...)"), so
// match on a stable prefix rather than the full string.
const COLUMN_PREFIXES = {
  name: "project",
  category: "main category",
  status: "status",
  owner: "owner",
  members: "other members",
  description: "description of project",
  links: "links or website",
  impact: "impact",
  deprecated: "deprecated",
} as const;

type ColumnKey = keyof typeof COLUMN_PREFIXES;

function locateColumns(header: string[]): Record<ColumnKey, number> {
  const index = {} as Record<ColumnKey, number>;
  for (const [key, prefix] of Object.entries(COLUMN_PREFIXES) as [ColumnKey, string][]) {
    index[key] = header.findIndex((cell) => cell.trim().toLowerCase().startsWith(prefix));
  }
  return index;
}

function clean(value: string | undefined): string | null {
  const text = (value ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return null;
  if (/^(n\/a|na|none|tbd|-{1,2})$/i.test(text)) return null;
  return text;
}

function parseBool(value: string | null): boolean {
  return value !== null && /^(true|yes|y|1|x|✓)$/i.test(value);
}

// The cell may hold several links on separate lines (Ahimsa In Action lists three)
// and often omits the scheme ("coffeebuddy.org"). project_website holds one URL.
function firstUrl(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(/\s+/).find((part) => part.length > 0);
  if (!first) return null;
  const trimmed = first.replace(/[.,;]+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
}

// ---------------------------------------------------------------------------
// Hasura
// ---------------------------------------------------------------------------

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${hasuraBase}/v1/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hasura-admin-secret": adminSecret as string },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  if (!body.data) throw new Error(`No data in response (HTTP ${response.status})`);
  return body.data;
}

async function ensureSchema(): Promise<void> {
  const sql = `
    ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS deprecated    BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS main_category TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS other_members TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS impact        TEXT DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_active
        ON projects (project_handle) WHERE deprecated = false;`;

  const sqlResponse = await fetch(`${hasuraBase}/v2/query`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hasura-admin-secret": adminSecret as string },
    body: JSON.stringify({ type: "run_sql", args: { source: "default", sql, cascade: false } }),
  });
  if (!sqlResponse.ok) throw new Error(`ensure-schema failed: ${(await sqlResponse.text()).slice(0, 300)}`);

  // New columns are invisible to GraphQL until metadata is reloaded.
  const reload = await fetch(`${hasuraBase}/v1/metadata`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hasura-admin-secret": adminSecret as string },
    body: JSON.stringify({ type: "reload_metadata", args: { reload_remote_schemas: false } }),
  });
  if (!reload.ok) throw new Error(`reload_metadata failed: ${(await reload.text()).slice(0, 300)}`);

}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

export type Project = {
  project_handle: string;
  project_name: string | null;
  owner: string | null;
  project_website: string | null;
  project_description: string | null;
  main_category: string | null;
  status: string | null;
  other_members: string | null;
  impact: string | null;
  deprecated: boolean;
};

// Fields the sheet owns. owner_email isn't here — the sheet has no email column, so
// whatever is in the database stays.
const SYNCED_FIELDS = [
  "project_name",
  "owner",
  "project_website",
  "project_description",
  "main_category",
  "status",
  "other_members",
  "impact",
  "deprecated",
] as const;

async function readSheet(): Promise<Project[]> {
  const response = await fetch(CSV_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(
      `Sheet fetch failed (HTTP ${response.status}). The sync reads the public CSV export — ` +
        `check that link sharing is still enabled on the spreadsheet.`
    );
  }

  const rows = parseCsv(await response.text());
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell.trim().toLowerCase() === "project"));
  if (headerIndex === -1) throw new Error("Could not find the header row (no 'Project' column)");

  const columns = locateColumns(rows[headerIndex]!);
  for (const [key, position] of Object.entries(columns)) {
    if (position === -1) throw new Error(`Sheet is missing the '${COLUMN_PREFIXES[key as ColumnKey]}' column`);
  }

  const projects: Project[] = [];
  const seen = new Map<string, string>();

  for (const row of rows.slice(headerIndex + 1)) {
    const name = clean(row[columns.name]);
    if (!name) continue; // blank spacer row

    const handle = handleFor(name);
    const previous = seen.get(handle);
    if (previous) {
      throw new Error(`"${name}" and "${previous}" both map to handle '${handle}' — add a HANDLE_OVERRIDES entry`);
    }
    seen.set(handle, name);

    projects.push({
      project_handle: handle,
      project_name: name,
      owner: clean(row[columns.owner]),
      project_website: firstUrl(clean(row[columns.links])),
      project_description: clean(row[columns.description]),
      main_category: clean(row[columns.category]),
      status: clean(row[columns.status]),
      other_members: clean(row[columns.members]),
      impact: clean(row[columns.impact]),
      deprecated: parseBool(clean(row[columns.deprecated])),
    });
  }

  if (projects.length === 0) throw new Error("Sheet has no project rows — refusing to sync");
  return projects;
}

async function readDatabase(): Promise<Map<string, Project>> {
  const data = await graphql<{ projects: Project[] }>(`
    query CurrentProjects {
      projects {
        project_handle
        project_name
        owner
        project_website
        project_description
        main_category
        status
        other_members
        impact
        deprecated
      }
    }
  `);
  return new Map(data.projects.map((project) => [project.project_handle, project]));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export type FieldChange = { field: string; from: unknown; to: unknown };

export type SyncResult = {
  sheetRows: number;
  inserts: Project[];
  updates: Array<{ project: Project; changes: FieldChange[] }>;
  unchanged: number;
  /** In the database but absent from the sheet. Never modified — only reported. */
  orphans: string[];
  affectedRows: number;
  dryRun: boolean;
};

export async function syncProjects(
  options: { dryRun?: boolean; ensureSchema?: boolean } = {}
): Promise<SyncResult> {
  const { dryRun = false, ensureSchema: shouldEnsureSchema = false } = options;

  if (!subdomain || !region || !adminSecret) {
    throw new Error("Missing NHOST_SUBDOMAIN / NHOST_REGION / NHOST_GRAPHQL_SECRET");
  }

  if (shouldEnsureSchema) await ensureSchema();

  const sheetProjects = await readSheet();
  const current = await readDatabase();

  const inserts: Project[] = [];
  const updates: Array<{ project: Project; changes: FieldChange[] }> = [];
  let unchanged = 0;

  for (const project of sheetProjects) {
    const existing = current.get(project.project_handle);
    if (!existing) {
      inserts.push(project);
      continue;
    }

    const changes = SYNCED_FIELDS.filter((field) => project[field] !== existing[field]).map((field) => ({
      field,
      from: existing[field],
      to: project[field],
    }));

    if (changes.length > 0) updates.push({ project, changes });
    else unchanged++;
  }

  const handlesInSheet = new Set(sheetProjects.map((p) => p.project_handle));
  // Array.from rather than spread — this tsconfig sets no `target`, so it defaults
  // to ES5 and rejects iterating a Map without downlevelIteration.
  const orphans = Array.from(current.keys()).filter((handle) => !handlesInSheet.has(handle));

  const pending = [...inserts, ...updates.map((u) => u.project)];
  let affectedRows = 0;

  if (pending.length > 0 && !dryRun) {
    const now = new Date().toISOString();
    const result = await graphql<{ insert_projects: { affected_rows: number } }>(
      `mutation SyncProjects($objects: [projects_insert_input!]!) {
        insert_projects(
          objects: $objects
          on_conflict: { constraint: projects_pkey, update_columns: [${SYNCED_FIELDS.join(", ")}, updated_at] }
        ) {
          affected_rows
        }
      }`,
      { objects: pending.map((project) => ({ ...project, updated_at: now })) }
    );
    affectedRows = result.insert_projects.affected_rows;
  }

  return { sheetRows: sheetProjects.length, inserts, updates, unchanged, orphans, affectedRows, dryRun };
}
