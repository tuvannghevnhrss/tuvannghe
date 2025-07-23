// -----------------------------------------------------------------------------
// CHỈ SỬA NHỮNG DÒNG BÊN DƯỚI – Giữ nguyên mọi logic khác
// -----------------------------------------------------------------------------
// ❶  Giữ **một** khai báo runtime duy nhất – xóa khai báo trùng

import { analyseCareer } from "@/lib/career/analyseKnowdell";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/* ✅ chỉ NHẤT MỘT khai báo runtime */
export const runtime = "edge";

export async function POST(req: Request) {
  const { holland, knowdell, topN = 5, salary = "median" } = await req.json();

  /* kiểm tra dữ liệu đầu vào */
  if (!holland || !Array.isArray(knowdell?.interests) || knowdell.interests.length === 0) {
    return new Response("Thiếu Holland code hoặc danh sách sở thích nghề nghiệp", { status: 400 });
  }

  /* gọi hàm AI phân tích */
  const suggestions = await analyseCareer({
    holland,
    knowdell,
    topN,
    salary,
  });

  /* lưu lại DB nếu cần – ví dụ: */
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (user)
    await supabase
      .from("career_profiles")
      .update({ suggested_jobs: suggestions })
      .eq("user_id", user.id);

  return Response.json({ suggestions });
}