import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supa = await createSupabaseRouteServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supa
    .from("knowdell_interests")
    .select("interest_key")
    .eq("user_id", user.id)
    .order("interest_key",{ascending:true});

  return NextResponse.json((data ?? []).map((r) => r.interest_key));
}

export async function POST(req: NextRequest) {
  const supa = await createSupabaseRouteServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const list: string[] = await req.json();

  /* xóa cũ, rồi insert mới */
  const { error: delError } = await supa.from("knowdell_interests").delete().eq("user_id", user.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (list.length) {
    const { error: insError } = await supa.from("knowdell_interests").insert(
      list.map((vi) => ({
        user_id: user.id,
        interest_key: vi,
        bucket: "very_interested",
      }))
    );
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
