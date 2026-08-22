import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";

/* chỉ lưu  tên kỹ năng, chưa dùng thang điểm love/pro để đơn giản */

export async function GET() {
  const supa = await createSupabaseRouteServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supa
    .from("knowdell_skills")
    .select("skill_key")
    .eq("user_id", user.id)
    .order("skill_key");

  return NextResponse.json((data ?? []).map(r => r.skill_key));
}

export async function POST(req: NextRequest) {
  const list: string[] = await req.json();        // mảng tối đa 15 skill
  const supa = await createSupabaseRouteServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { error: delError } = await supa.from("knowdell_skills").delete().eq("user_id", user.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (list.length) {
    const { error: insError } = await supa.from("knowdell_skills").insert(
      list.map((k) => ({
        user_id: user.id,
        skill_key: k,
        love_level: null,
        proficiency: null,
      }))
    );
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
