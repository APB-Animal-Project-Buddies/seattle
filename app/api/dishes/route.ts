import { NextResponse } from "next/server";
import { graphql } from "@/lib/nhost";
import { buildDishData } from "@/lib/dishes";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  let dishData;
  try { dishData = buildDishData(body ?? {}); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

  try {
    const res = await graphql<{ insert_dishes_one: { id: number } }>(
      `mutation AddDish($name: String!, $data: jsonb!) {
         insert_dishes_one(object: { dish_name: $name, dish_data: $data }) { id }
       }`,
      { useAdminSecret: true, variables: { name: dishData.title as string, data: dishData } }
    );
    if (res.errors?.length) {
      console.error("insert dish failed:", res.errors);
      return NextResponse.json({ error: "Could not save recipe" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: res.data?.insert_dishes_one?.id });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 });
  }
}
