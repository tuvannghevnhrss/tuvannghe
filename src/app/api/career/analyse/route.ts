import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

import { analyseKnowdell } from "@/lib/career/analyseKnowdell";
import { matchJobs }       from "@/lib/career/matchJobs";  // alias đã khai báo

/* ---------------------------------------------------------- *
 *  POST /api/career/analyse
 *  • Lấy hồ sơ (career_profiles) của user hiện tại
 *  • Phân tích Knowdell  ➜  trả về summary + bảng markdown
 *  • Gợi ý 5 nghề phù hợp ➜  matchJobs()
 *  • Trả JSON cho OptionsTab hiển thị
 * ---------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    /* 1. Xác thực Supabase */
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    /* 2. Lấy hồ sơ nghề nghiệp */
    const { data: profile, error } = await supabase
      .from("career_profiles")
      .select(
        "mbti:type,holland:code,knowdell->values,knowdell->skills,knowdell->interests"
      )
      .eq("user_id", user.id)
      .single();

    if (error || !profile)
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });

    /* 3. Phân tích & gợi ý nghề */
    const analysis     = analyseKnowdell(profile);
    const suggestedJob = await matchJobs(profile);

    /* 4. OK */
    return NextResponse.json(
      {
        ok: true,
        analysis,
        suggested_jobs: suggestedJob,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("analyse route:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

/* chạy trên Edge Runtime để phản hồi nhanh hơn (tùy chọn) */
export const runtime = "edge";
