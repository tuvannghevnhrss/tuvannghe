/* -------------------------------------------------------------------------
   POST /api/career/analyse            Edge Runtime
   ------------------------------------------------------------------------ */
import { NextResponse } from "next/server";
import { analyseCareer } from "@/lib/career/analyseKnowdell";
import type { Database } from "@/types/supabase";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
async function safeJson(req: Request) {
  if (req.headers.get("content-type")?.includes("application/json")) {
    const text = await req.text();
    if (text.trim().length) return JSON.parse(text);
  }
  return null;               // body rỗng hoặc sai header
}
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    /* 1 ⟩ Parse */
    const payload = await safeJson(req);
    if (!payload) {
      return NextResponse.json(
        { error: "Request body must be JSON." },
        { status: 400 },
      );
    }

    /* 2 ⟩ Lấy dữ liệu & validate */
    const { holland, knowdell = {} } = payload;
    if (!holland || !knowdell.interests?.length) {
      return NextResponse.json(
        { error: "Thiếu Holland hoặc Knowdell.interests" },
        { status: 400 },
      );
    }

    /* 3 ⟩ Gọi hàm phân tích */
    const suggestions = await analyseCareer({
      holland_profile: { [holland[0]]: 1, [holland[1]]: 1, [holland[2]]: 1 },
      knowdell_summary: knowdell,
    });

    /* 4 ⟩ Lưu vào Supabase (nếu user đã login) */
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("career_profiles")
        .update({ suggested_jobs: suggestions })
        .eq("user_id", user.id);
    }

    /* 5 ⟩ Trả kết quả */
    return NextResponse.json({ jobs: suggestions });
  } catch (err: any) {
    console.error("analyse error:", err);
    return NextResponse.json(
      { error: err.message || "Analyse failed" },
      { status: 500 },
    );
  }
}
