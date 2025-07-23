// -----------------------------------------------------------------------------
// CHỈ SỬA NHỮNG DÒNG BÊN DƯỚI – Giữ nguyên mọi logic khác
// -----------------------------------------------------------------------------
// ❶  Giữ **một** khai báo runtime duy nhất – xóa khai báo trùng
export const runtime = "edge";                // chạy Edge – phản hồi nhanh hơn

// -----------------------------------------------------------------------------
// PHẦN CODE GỐC BÊN DƯỚI GIỮ NGUYÊN (KHÔNG THAY ĐỔI)
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { analyseCareer } from "@/lib/career/analyseKnowdell";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  /* 1. Lấy thông tin hồ sơ */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("career_profiles")
    .select(
      `mbti_type, holland_profile, knowdell_summary, knowdell`
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "Thiếu dữ liệu hồ sơ" },
      { status: 400 }
    );
  }

  /* 2. Gọi hàm AI phân tích */
  const result = await analyseCareer({
    mbti: profile.mbti_type ?? undefined,
    holland: profile.holland_profile ?? undefined,
    knowdell: profile.knowdell_summary ?? profile.knowdell ?? undefined,
  });

  /* 3. Trả về kết quả */
  return NextResponse.json({ result });
}
