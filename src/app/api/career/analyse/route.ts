/* -------------------------------------------------------------------------
   POST /api/career/analyse       (Edge Runtime)
   ------------------------------------------------------------------------ */
import { NextResponse } from "next/server";
import { callGPT, AnalyseArgs } from "@/lib/career/analyseKnowdell";
import type { Database } from "@/types/supabase";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/* ---------- Helper tạo Supabase – gọi TRONG handler ---------- */
async function getServiceClient() {
  /* dynamic import để tránh chạy khi build */
  const { createClient } = await import("@supabase/supabase-js");

  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường"
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

/* ---------- Route handler ---------- */
export async function POST(req: Request) {
  try {
    /* 1 ⟩ Lấy dữ liệu body */
    const { holland, knowdell = {}, topN = 5 } = await req.json();

    const interests = knowdell.interests ?? [];
    if (!holland || holland.length < 3 || interests.length === 0) {
      return NextResponse.json(
        { error: "Thiếu Holland hoặc danh sách nghề hứng thú." },
        { status: 400 },
      );
    }

    /* 2 ⟩ Chuẩn hoá tham số & gọi GPT */
    const args: AnalyseArgs = {
      mbti  : "",
      holland: holland.slice(0, 3).toUpperCase(),
      values:  knowdell.values  ?? [],
      skills:  knowdell.skills  ?? [],
      interests,
      selectedTitles: interests
        .slice(0, 20)
        .map((it: any) => it.interest_key || it.value_key || it),
    };

    const gpt = await callGPT(args);

    /* 3 ⟩ Lấy TOP-N nghề */
    const jobs = (gpt.topCareers ?? [])
      .slice(0, topN)
      .map((c: any) => String(c.career || "").trim())
      .filter(Boolean);

    /* 4 ⟩ Ghi lại suggested_jobs  */
    const supabase = await getServiceClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("career_profiles")
        .update({ suggested_jobs: jobs })
        .eq("user_id", user.id);
    }

    /* 5 ⟩ Trả kết quả đầy đủ về client */
    return NextResponse.json({
      summary       : gpt.summary,
      careerRatings : gpt.careerRatings,
      topCareers    : jobs,
    });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err?.message || "Analyse failed" },
      { status: 500 },
    );
  }
}
