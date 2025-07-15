import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// hãy tách logic phân tích ra hàm riêng (analyseKnowdell.ts) để route sạch
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime = "edge";             // chạy Edge – phản hồi nhanh hơn

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  /* ---- lấy hồ sơ hiện tại ------------------------------------------------ */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type, holland_profile, knowdell_summary")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No profile data" },
      { status: 400 }
    );
  }

  /* ---- gọi AI / hàm phân tích ------------------------------------------- */
  const jobs = await analyseCareer(profile);

  /* ---- lưu Suggested jobs vào DB (tuỳ chọn) ------------------------------ */
  await supabase
    .from("career_profiles")
    .update({ suggested_jobs: jobs, analysis_updated_at: new Date() })
    .eq("user_id", user.id);

  return NextResponse.json({ jobs });
}
