/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
 * ------------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime  = "edge";          // ❗ chỉ KHAI BÁO 1 lần
export const dynamic  = "force-dynamic";

/* ------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    /* ---------- 1. Lấy body ---------- */
    const body = await req.json();
    const {
      holland: hollandCodeOrNull,        // chuỗi 3-ký-tự hoặc null
      knowdell = {},
      topN   = 5,
      salary = "high",
    } = body;

    /* ---------- 2. Lấy Supabase + user ---------- */
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    /* ---------- 3. Lấy holland_profile (object điểm) ---------- */
    let hollandProfile: Record<string, number> | null = null;

    // 3.1  Nếu client đã gửi object hoàn chỉnh
    if (
      hollandCodeOrNull &&
      typeof hollandCodeOrNull === "object" &&
      Object.values(hollandCodeOrNull).every((v) => typeof v === "number")
    ) {
      hollandProfile = hollandCodeOrNull;
    }

    // 3.2  Nếu client chỉ gửi chuỗi (ECR …) → tra DB lấy profile
    if (!hollandProfile) {
      const { data: profile } = await supabase
        .from("career_profiles")
        .select("holland_profile")
        .eq("user_id", user.id)
        .maybeSingle();
      hollandProfile = profile?.holland_profile ?? null;
    }

    /* ---------- 4. Lấy interests ---------- */
    const interests: string[] =
      knowdell.interests ??
      knowdell.careers ??     // fallback khi client đặt tên careers
      [];

    /* ---------- 5. Ràng buộc tối thiểu ---------- */
    if (!hollandProfile || interests.length === 0) {
      return NextResponse.json(
        { error: "Thiếu Holland profile hoặc sở thích nghề nghiệp." },
        { status: 400 },
      );
    }

    /* ---------- 6. Phân tích ---------- */
    const suggestions = await analyseCareer({
      holland: hollandProfile,   // ✅ truyền object điểm
      knowdell: {
        values:     knowdell.values ?? [],
        skills:     knowdell.skills ?? [],
        interests,
      },
      topN,
      salary,
    });

    /* ---------- 7. Lưu & trả kết quả ---------- */
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
