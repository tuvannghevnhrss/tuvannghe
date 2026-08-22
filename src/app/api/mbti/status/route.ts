// API: GET /api/mbti/status
import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/constants";

export async function GET() {
  const supabase = await createSupabaseRouteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ------------------------------------------------------------
     MBTI luôn FREE → coi như ‘paid = true’.
     Kiểm tra xem user đã có kết quả hay chưa để trả về `done`.
  ------------------------------------------------------------ */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    paid: true,
    done: !!profile?.mbti_type,        // true khi đã lưu kết quả
    status: STATUS.PAID,               // cho đồng bộ hằng trạng thái
  });
}
