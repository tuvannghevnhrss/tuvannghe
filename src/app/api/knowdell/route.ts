import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/* ---------- Kiểu payload ---------- */
type Body = {
  values?: string[];                                  // TOP-10
  skills?: { key: string; love: number; pro: number }[]; // TOP-15
  interests?: string[];                               // TOP-20
};

/* ---------- Supabase kèm cookie ---------- */
const supa = () => createRouteHandlerClient({ cookies });

/* ═══════════ GET – trả về 1 bộ thẻ ═══════════ */
export async function GET(req: NextRequest) {
  const part = req.nextUrl.searchParams.get("part");          // values | skills | interests
  if (!part) return NextResponse.json([]);

  const supabase = supa();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  /* Lấy dữ liệu từng bảng */
  let rows: any[] = [];
  if (part === "values")       ({ data: rows } = await supabase.from("knowdell_values"   ).select("value_key"                                      ).eq("user_id", user.id).order("rank"));
  else if (part === "skills")  ({ data: rows } = await supabase.from("knowdell_skills"   ).select("skill_key,love_level,proficiency"              ).eq("user_id", user.id).order("love_level",{ascending:false}));
  else if (part === "interests")({ data: rows } = await supabase.from("knowdell_interests").select("interest_key"                                 ).eq("user_id", user.id).order("interest_key"));

  const arr = part === "values"
    ? rows.map(r => r.value_key)
    : part === "interests"
    ? rows.map(r => r.interest_key)
    : rows;                                        // skills: giữ object nguyên
  return NextResponse.json(arr ?? []);
}

/* ═══════════ POST – ghi 1 hoặc nhiều bộ thẻ ═══════════ */
export async function POST(req: NextRequest) {
  const body      = (await req.json()) as Body;
  const supabase  = supa();

  /* ── auth ── */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const uid = user.id;

  /* ── Lấy Knowdell cũ (để giữ nguyên phần chưa sửa) ── */
  const { data: oldP } = await supabase
    .from("career_profiles")
    .select("knowedell")                 // ❗ cột của bạn là knowdell
    .eq("user_id", uid)
    .single();
  const prev = oldP?.knowedell ?? { values: [], skills: [], interests: [] };

  /* ── Giá trị cốt lõi ── */
  if (body.values) {
    const rowsVal = body.values.map((v, i) => ({
      user_id  : uid,
      value_key: v,
      rank     : i + 1,
    }));
    await supabase.from("knowdell_values").delete().eq("user_id", uid);
    await supabase.from("knowdell_values").insert(rowsVal);
    prev.values = rowsVal;                       // cập nhật bộ nhớ
  }

  /* ── Kỹ năng động lực ── */
  if (body.skills) {
    const rowsSkill = body.skills.map(s => ({
      user_id     : uid,
      skill_key   : s.key,
      love_level  : s.love,
      proficiency : s.pro,
    }));
    await supabase.from("knowdell_skills").delete().eq("user_id", uid);
    await supabase.from("knowdell_skills").insert(rowsSkill);
    prev.skills = rowsSkill;
  }

  /* ── Sở thích ── */
  if (body.interests) {
    const rowsInt = body.interests.map(k => ({
      user_id     : uid,
      interest_key: k,
      bucket      : "very_interested",
    }));
    await supabase.from("knowdell_interests").delete().eq("user_id", uid);
    await supabase.from("knowdell_interests").insert(rowsInt);
    prev.interests = rowsInt;
  }

  /* ── Upsert career_profiles (chỉ 1 hàng / user) ── */
  const { error } = await supabase
    .from("career_profiles")
    .upsert({
      user_id   : uid,
      knowdell  : prev,
      updated_at: new Date(),
    });

  if (error) {
    console.error("Upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
