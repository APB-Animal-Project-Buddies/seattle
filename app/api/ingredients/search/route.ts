import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  if (q.length > 60) return NextResponse.json({ error: "Query too long" }, { status: 400 });

  const res = await graphql<{ ingredients: Array<{ id: string; name: string; vegan: boolean | null }> }>(
    `query Search($pat: String!) {
       ingredients(
         where: { _and: [ { search_text: { _ilike: $pat } }, { alias_of: { _is_null: true } } ] },
         limit: 40
       ) { id name vegan }
     }`,
    { useAdminSecret: true, variables: { pat: `%${q}%` } }
  );
  if (res.errors?.length) return NextResponse.json({ error: "Search failed" }, { status: 502 });

  const rank = (n: string) => {
    const ln = n.toLowerCase();
    if (ln === q) return 0;
    if (ln.startsWith(q)) return 1;
    return 2;
  };
  const results = (res.data?.ingredients ?? [])
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.length - b.name.length)
    .slice(0, 10);
  return NextResponse.json({ results });
}
