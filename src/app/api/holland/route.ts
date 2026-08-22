import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { code } = await req.json();              // { code:"RIA" }
  const supabase = await createSupabaseRouteServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  // Cùng điều kiện "đã trả phí Holland" đang dùng ở GET /api/holland/status —
  // không tạo logic payment thứ hai. UI/middleware chỉ chặn được trang, API
  // ghi kết quả phải tự kiểm tra quyền vì đây mới là nơi thật sự ghi dữ liệu.
  const { data: paidRow } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", uid)
    .eq("product", "holland")
    .eq("status", STATUS.PAID)
    .maybeSingle();

  if (!paidRow) {
    return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 403 });
  }

  await supabase.from("holland_results").insert({ user_id: uid, code });

  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: uid, holland: { code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
