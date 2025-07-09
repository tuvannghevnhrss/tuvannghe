import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/* ───────── GET ───────── */
export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supa
    .from("knowdell_values")
    .select("value_key")
    .eq("user_id", user.id)
    .order("rank");

  return NextResponse.json((data ?? []).map(r => r.value_key));
}

/* ───────── POST ───────── */
export async function POST(req: NextRequest) {
  const list: string[] = await req.json();        // mảng tối đa 10 value
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  await supa.from("knowdell_values").delete().eq("user_id", user.id);
  if (list.length) {
    await supa.from("knowdell_values").insert(
      list.map((v, i) => ({
        user_id: user.id,
        value_key: v,
        rank: i + 1,
      }))
    );
  }
  return NextResponse.json({ ok: true });
}
