/* -------------------------------------------------------------------------
   POST /api/career/analyse   –  gọi GPT, lưu suggested_jobs, trả danh sách
   ------------------------------------------------------------------------- */
import { NextResponse }                from "next/server";
import { cookies }                     from "next/headers";
import { createRouteHandlerClient }    from "@supabase/auth-helpers-nextjs";
import type { Database }               from "@/types/supabase";
import { analyseCareer }               from "@/lib/career/analyseKnowdell";

export const runtime = "edge";          // 1 lần duy nhất
export const dynamic = "force-dynamic";

export async function POST(req:Request) {
  try {
    /* -------- body -------- */
    const { holland, knowdell, topN = 5 } = await req.json() ?? {};
    if (!holland || holland.length !== 3)
      return NextResponse.json({ error:"Thiếu / sai mã Holland" },{ status:400 });

    /* -------- Supabase user -------- */
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error:"Unauthenticated" },{status:401});

    /* -------- gọi GPT / heuristic -------- */
    const suggestions = await analyseCareer({
      holland_profile : {            // giả profile đủ tối thiểu cho analyseCareer
        [holland[0]]:3, [holland[1]]:2, [holland[2]]:1
      },
      knowdell_summary: knowdell
    });

    /* -------- cắt topN & lưu DB -------- */
    const top = suggestions.slice(0, topN);

    await supabase
      .from("career_profiles")
      .update({ suggested_jobs: top })
      .eq("user_id", user.id);

    return NextResponse.json({ jobs: top });
  } catch (e:any) {
    console.error("analyse error:",e);
    return NextResponse.json({ error:e?.message ?? "Analyse failed" },{status:500});
  }
}
