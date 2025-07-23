/* ------------------------------------------------------------------------- *
   POST /api/career/analyse – hỏi GPT, lưu JSON vào suggested_jobs           *
 * ------------------------------------------------------------------------- */
import { NextResponse }               from "next/server";
import { cookies }                    from "next/headers";
import { createRouteHandlerClient }   from "@supabase/auth-helpers-nextjs";
import type { Database }              from "@/types/supabase";
import { analyseCareer }              from "@/lib/career/analyseKnowdell";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(){
  try{
    const supa = createRouteHandlerClient<Database>({ cookies });
    const { data:{ user } } = await supa.auth.getUser();
    if(!user) return NextResponse.json({error:"Unauth"},{status:401});

    const { data:profile } = await supa
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id",user.id)
      .maybeSingle();

    if(!profile) return NextResponse.json({error:"No profile"}, {status:400});

    /* ---- GPT ---- */
    const gptJson = await analyseCareer(profile);

    /* ---- lưu ---- */
    await supa.from("career_profiles")
      .update({ suggested_jobs:gptJson })
      .eq("user_id",user.id);

    return NextResponse.json(gptJson);        // gửi nguyên về client
  }catch(e:any){
    console.error("analyse error:",e);
    return NextResponse.json({error:e.message||"Analyse failed"},{status:500});
  }
}
