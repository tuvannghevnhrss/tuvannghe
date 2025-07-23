/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
 * ------------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime  = "edge";          // khai báo đúng 1 lần
export const dynamic  = "force-dynamic";

export async function POST(req: Request) {
  try {
    /* ---------- tham số tuỳ chọn từ client ---------- */
    const { topN = 5 } = (await req.json().catch(() => ({}))) as {
      topN?: number;
    };

    /* ---------- Supabase ---------- */
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { data: profile } = await supabase
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile)
      return NextResponse.json(
        { error: "Chưa có dữ liệu hồ sơ" },
        { status: 400 },
      );

    /* ---------- Gọi hàm GPT ---------- */
    let suggestions = await analyseCareer(profile);
    if (topN > 0) suggestions = suggestions.slice(0, topN);

    /* ---------- Lưu lại DB ---------- */
    await supabase
      .from("career_profiles")
      .update({ suggested_jobs: suggestions })
      .eq("user_id", user.id);

    return NextResponse.json({ jobs: suggestions });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Analyse failed" },
      { status: 500 },
    );
  }
}
