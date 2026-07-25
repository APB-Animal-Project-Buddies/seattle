import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

type ProjectsResponse = {
  projects: Array<{
    project_handle: string;
    project_name: string | null;
    project_website: string | null;
    project_description: string | null;
    main_category: string | null;
    status: string | null;
    owner: string | null;
    other_members: string | null;
    impact: string | null;
  }>;
};

export async function GET() {
  // Deprecated projects stay in the table (snapshots reference their handle) but are
  // never listed publicly. The extra fields mirror the APB projects sheet — see
  // backend_migrations/scripts/sync-projects-from-sheet.ts.
  //
  // Goes through lib/nhost's graphql() rather than a bare fetch so the response isn't
  // held in Next's Data Cache — otherwise a sheet sync doesn't show up until redeploy.
  const result = await graphql<ProjectsResponse>(
    `query GetProjects {
      projects(where: { deprecated: { _eq: false } }, order_by: { project_handle: asc }) {
        project_handle
        project_name
        project_website
        project_description
        main_category
        status
        owner
        other_members
        impact
      }
    }`,
    { useAdminSecret: true }
  );

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0]?.message }, { status: 500 });
  }

  return NextResponse.json({ projects: result.data?.projects ?? [] });
}
