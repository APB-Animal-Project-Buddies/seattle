import { NextResponse } from "next/server";
import { syncProjects } from "@/backend_migrations/scripts/lib/sync-projects";

// The sync fetches the sheet CSV and upserts every row — well past the default budget.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Pushes the APB projects Google Sheet into the `projects` table.
 *
 * Called by the sheet's "APB → Sync projects to prod" Apps Script menu item, which
 * holds only this scoped key — never the Hasura admin secret, since anyone who can
 * edit the sheet can read its Script Properties.
 *
 * POST /api/projects/sync            apply the sync
 * POST /api/projects/sync?dryRun=1   report the diff, write nothing
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.PROJECTS_SYNC_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") !== null;

  try {
    const result = await syncProjects({ dryRun });

    return NextResponse.json({
      ok: true,
      dryRun: result.dryRun,
      sheetRows: result.sheetRows,
      inserted: result.inserts.map((p) => p.project_handle),
      updated: result.updates.map((u) => ({
        project_handle: u.project.project_handle,
        fields: u.changes.map((c) => c.field),
      })),
      unchanged: result.unchanged,
      // In the database but missing from the sheet — reported, never modified.
      orphans: result.orphans,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
