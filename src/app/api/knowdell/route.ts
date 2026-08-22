import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/constants";

/* ---------- Kiểu payload ---------- */
type Body = {
  values?: string[];                                  // TOP-10
  skills?: { key: string; love: number; pro: number }[]; // TOP-15
  interests?: string[];                               // TOP-20
};

/* ═══════════ GET – trả về 1 bộ thẻ ═══════════ */
export async function GET(req: NextRequest) {
  const part = req.nextUrl.searchParams.get("part");          // values | skills | interests
  if (!part) return NextResponse.json([]);

  const supabase = await createSupabaseRouteServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  /* Lấy dữ liệu từng bảng */
  let rows: any[] = [];
  if (part === "values") {
    const { data } = await supabase.from("knowdell_values").select("value_key").eq("user_id", user.id).order("rank");
    rows = data ?? [];
  } else if (part === "skills") {
    const { data } = await supabase.from("knowdell_skills").select("skill_key,love_level,proficiency").eq("user_id", user.id).order("love_level", { ascending: false });
    rows = data ?? [];
  } else if (part === "interests") {
    const { data } = await supabase.from("knowdell_interests").select("interest_key").eq("user_id", user.id).order("interest_key");
    rows = data ?? [];
  }

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
  const supabase  = await createSupabaseRouteServerClient();

  /* ── auth ── */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const uid = user.id;

  // Cùng điều kiện "đã trả phí Knowdell" đang dùng ở knowdell/quiz/page.tsx
  // (qua GET /api/payments/status?product=knowdell) — không tạo logic
  // payment thứ hai. Middleware chỉ chặn trang /knowdell, API ghi kết quả
  // phải tự kiểm tra vì đây mới là nơi thật sự ghi dữ liệu.
  const { data: paidRow } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", uid)
    .eq("product", "knowdell")
    .eq("status", STATUS.PAID)
    .maybeSingle();

  if (!paidRow) {
    return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 403 });
  }

  /* ── Lấy Knowdell cũ (để giữ nguyên phần chưa sửa) ── */
  const { data: oldP } = await supabase
    .from("career_profiles")
    .select("knowdell")
    .eq("user_id", uid)
    .single();
  const prev = oldP?.knowdell ?? { values: [], skills: [], interests: [] };

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
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
