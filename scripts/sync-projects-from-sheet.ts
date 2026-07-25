// Sync the APB projects Google Sheet into the `projects` table.
//
// The sheet is the source of truth for project metadata (name, owner, category,
// status, description, links, impact, deprecated). This script pulls it down and
// upserts every row. It never deletes: a project that disappears from the sheet is
// reported as a warning and left untouched, because project_handle is a foreign key
// target for account_snapshots / project_snapshots.
//
// Usage:
//   bun run scripts/sync-projects-from-sheet.ts --dry-run   # show the diff, write nothing
//   bun run scripts/sync-projects-from-sheet.ts             # apply
//   bun run scripts/sync-projects-from-sheet.ts --ensure-schema
//
// --ensure-schema applies the idempotent column additions from backend_migrations'
// 1784950000000_add_project_sheet_columns and reloads Hasura metadata, for when git
// auto-deploy hasn't applied the migration yet.
//
// The logic lives in ../lib/sync-projects.ts so the sheet's Apps Script menu can run
// the same sync through POST /api/projects/sync.
//
// Env: NHOST_SUBDOMAIN, NHOST_REGION, NHOST_GRAPHQL_SECRET (Bun auto-loads .env).
import { syncProjects } from "../lib/sync-projects";

const argv = new Set(process.argv.slice(2));
const dryRun = argv.has("--dry-run") || argv.has("-n");
const ensureSchema = argv.has("--ensure-schema");

function describe(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  const text = String(value).replace(/\n/g, " ");
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

try {
  if (ensureSchema) console.log("Ensuring schema (columns + index + metadata reload)…");

  const result = await syncProjects({ dryRun, ensureSchema });
  console.log(`Read ${result.sheetRows} project rows from the sheet.\n`);

  for (const project of result.inserts) {
    console.log(`+ ${project.project_handle}${project.deprecated ? "  (deprecated)" : ""}`);
    console.log(`    ${describe(project.project_description)}`);
  }
  for (const { project, changes } of result.updates) {
    console.log(`~ ${project.project_handle}`);
    for (const change of changes) {
      console.log(`    ${change.field}: ${describe(change.from)} → ${describe(change.to)}`);
    }
  }
  if (result.unchanged > 0) console.log(`= ${result.unchanged} project(s) already up to date`);

  if (result.orphans.length > 0) {
    console.log(
      `\n⚠ ${result.orphans.length} project(s) in the database but not in the sheet — left untouched: ${result.orphans.join(", ")}`
    );
    console.log("  Add them to the sheet (with Deprecated = TRUE if they're wound down) to bring them under sync.");
  }

  if (result.inserts.length === 0 && result.updates.length === 0) {
    console.log("\nNothing to do.");
    process.exit(0);
  }

  if (dryRun) {
    console.log(
      `\n[dry run] Would insert ${result.inserts.length} and update ${result.updates.length} project(s). No changes made.`
    );
    process.exit(0);
  }

  console.log(
    `\n✓ Synced ${result.affectedRows} project(s) — ${result.inserts.length} inserted, ${result.updates.length} updated.`
  );
} catch (error) {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
