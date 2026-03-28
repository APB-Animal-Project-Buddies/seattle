import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

type IdeasResponse = {
  ideas: Array<{
    id: string;
    idea: string;
    sub_ideas: string | null;
    other_notes: string | null;
    contact_email: string | null;
    sort_order: number;
  }>;
};

export async function GET() {
  const result = await graphql<IdeasResponse>(
    `query GetIdeas {
      ideas(order_by: { sort_order: asc }) {
        id
        idea
        sub_ideas
        other_notes
        contact_email
        sort_order
      }
    }`,
    { useAdminSecret: true }
  );

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0]?.message }, { status: 500 });
  }

  return NextResponse.json({ ideas: result.data?.ideas ?? [] });
}

export async function POST(request: Request) {
  // Auth check
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.IDEAS_SYNC_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an array" }, { status: 400 });
  }

  if (body.length > 500) {
    return NextResponse.json({ error: "Too many ideas (max 500)" }, { status: 400 });
  }

  // Filter and validate
  const MAX_LEN = 10000;
  const truncate = (s: unknown): string | null => {
    if (typeof s !== "string" || s.trim() === "") return null;
    return s.slice(0, MAX_LEN);
  };

  const ideas = body
    .filter((item: unknown): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).idea === "string" && ((item as Record<string, unknown>).idea as string).trim() !== ""
    )
    .map((item, index) => ({
      idea: truncate(item.idea)!,
      sub_ideas: truncate(item.sub_ideas),
      other_notes: truncate(item.other_notes),
      contact_email: truncate(item.contact_email),
      sort_order: index,
    }));

  if (ideas.length === 0) {
    return NextResponse.json({ error: "No valid ideas to sync (refusing empty payload)" }, { status: 400 });
  }

  // Atomic delete + insert in a single GraphQL request
  const result = await graphql<{ delete_ideas: { affected_rows: number }; insert_ideas: { affected_rows: number } }>(
    `mutation SyncIdeas($ideas: [ideas_insert_input!]!) {
      delete_ideas(where: {}) {
        affected_rows
      }
      insert_ideas(objects: $ideas) {
        affected_rows
      }
    }`,
    {
      useAdminSecret: true,
      variables: { ideas },
    }
  );

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0]?.message }, { status: 500 });
  }

  return NextResponse.json({ synced: result.data?.insert_ideas?.affected_rows ?? 0 });
}
