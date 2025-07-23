/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
   ------------------------------------------------------------------------- */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime = "edge";          // KHAI BÁO 1 lần duy nhất
export const dynamic = "force-dynamic"; // giữ nguyên để luôn chạy mới

/* -------------------------------------------------------------------------- */
export async function POST() {
  try {
    /* 1 ▸ Supabase — dùng đúng cookies() của Next.js (lỗi vừa qua do [] ) */
    const supabase = createRouteHandlerClient<Database>({ cookies });

    /* 2 ▸ xác thực */
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 3 ▸ lấy hồ sơ (chỉ 2 cột cần thiết) */
    const { data: rawProfile, error } = await supabase
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!rawProfile) {
      return NextResponse.json({ error: "Chưa có dữ liệu hồ sơ." }, { status: 404 });
    }

    /* 4 ▸ nếu interests trống → lấy thêm TOP interests đã lưu */
    let interests = rawProfile.knowdell_summary?.interests ?? [];
    if (interests.length === 0) {
      const { data } = await supabase
        .from("knowdell_interests")
        .select("interest_key")
        .eq("user_id", user.id)
        .order("rank", { ascending: true });

      interests = (data ?? []).map((r) => ({ interest_key: r.interest_key }));
    }

    /* 5 ▸ build profile tối thiểu cho GPT */
    const profile = {
      holland_profile  : rawProfile.holland_profile,
      knowdell_summary : { ...(rawProfile.knowdell_summary ?? {}), interests },
    };

    /* 6 ▸ GPT phân tích */
    const analysis = await analyseCareer(profile);           // full JSON
     const suggestions = (analysis.topCareers ?? [])
       .slice(0, 5)
       .map((c: any) => String(c.career || "").trim())
       .filter(Boolean);

    /* 7 ▸ lưu & trả về */
    await supabase
      .from("career_profiles")
      .update({
         suggested_jobs:    suggestions,
         suggested_details: analysis          // ‼️ thêm cột JSON (text) nếu chưa có
       })
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

    return NextResponse.json({ jobs: suggestions, analysis });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Analyse failed" },
      { status: 500 },
    );
  }
}
