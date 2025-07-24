/* ------------------------------------------------------------------------- *
   API  POST /api/career/analyse
 * ------------------------------------------------------------------------- */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/supabase";
import { analyseCareer /* alias của analyseKnowdell */ } from "@/lib/career/analyseKnowdell";

export const runtime  = "edge";
export const dynamic  = "force-dynamic";

export async function POST() {
  try {
    /* ---------- Supabase auth ---------- */
    const sb = createRouteHandlerClient<Database>({ cookies });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "401" }, { status: 401 });

    /* ---------- 1. Lấy Holland + Knowdell ---------- */
    const { data: profile } = await sb
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "No profile" }, { status: 400 });
    }

    /* ---------- 2. Interests: bảng knowdell_interests ---------- */
    const { data: intRows } = await sb
      .from("knowdell_interests")
      .select("interest_key")
      .eq("user_id", user.id)
      .eq("bucket", "very_interested")
      .limit(20);

    const interests: string[] = (intRows ?? []).map(r => r.interest_key);

    /* ---------- 3. Short-list nghề: bảng jobs ---------- */
    const top3Codes = Object.entries(profile.holland_profile ?? {})
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([c]) => c);                                            // ["E","C","R"]

    const { data: jobRows } = await sb
      .from("jobs")
      .select("title, avg_salary, holland_codes")
      .overlaps("holland_codes", top3Codes)
      .limit(100);

    const score = (row: any) =>
      (interests.includes(row.title) ? 2 : 0) +
      (row.holland_codes?.includes(top3Codes[0]) ? 1 : 0);

    const shortlist = (jobRows ?? [])
      .sort((a, b) => score(b) - score(a) || (b.avg_salary - a.avg_salary))
      .slice(0, 20)
      .map(r => ({
        title:  r.title,
        salary: r.avg_salary ?? 0,
      }));

    /* ---------- 4. Gọi GPT ---------- */
    const gptResult = await analyseCareer({
      holland_profile : profile.holland_profile,
      knowdell_summary: profile.knowdell_summary,
      interests,
      shortlist,                                 // 20 nghề + lương median
    });

    /* ---------- 5. Lưu & trả ---------- */
    await sb
      .from("career_profiles")
      .update({ suggested_jobs: gptResult })     // kiểu jsonb
      .eq("user_id", user.id);

    return NextResponse.json(gptResult);          // FE nhận toàn bộ JSON
  } catch (e: any) {
    console.error("analyse error:", e);
    return NextResponse.json(
      { error: e?.message ?? "500" },
      { status: 500 },
    );
  }
}
