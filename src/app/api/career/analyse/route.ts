import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";   // ➜ lấy cookie runtime

import type { Database } from "@/types/supabase";
import { analyseCareer } from "@/lib/career/analyseKnowdell";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sb = createRouteHandlerClient<Database>({ cookies });
    const { data:{ user } } = await sb.auth.getUser();
    if(!user) return NextResponse.json({error:"401"}, {status:401});

    /* ------- Holland + Knowdell (values/skills) ------- */
    const { data: profile } = await sb
      .from("career_profiles")
      .select("holland_profile, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle();
    if(!profile) return NextResponse.json({error:"No profile"},{status:400});

    /* ------- interests (bảng knowdell_interests) ------- */
    const { data: intRows } = await sb
      .from("knowdell_interests")
      .select("interest_key")
      .eq("user_id", user.id)
      .eq("bucket","very_interested")
      .limit(20);
    const interests = (intRows??[]).map(r=>r.interest_key);

    /* ------- shortlist nghề (bảng jobs) ------- */
    const top3 = Object.entries(profile.holland_profile||{})
      .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c])=>c);
    const { data: jobRows } = await sb
      .from("jobs")
      .select("title, avg_salary, holland_codes")
      .overlaps("holland_codes", top3)
      .limit(100);              // lọc sẵn theo Holland

    /* điểm = +2 nếu title trùng interests, +1 nếu mã Holland khớp vị trí #1 */
    const score = (row:any)=>(
      (interests.includes(row.title)?2:0) +
      (row.holland_codes?.includes(top3[0])?1:0)
    );
    const shortlist = (jobRows??[])
      .sort((a,b)=>score(b)-score(a) || (b.avg_salary-a.avg_salary))
      .slice(0,20)
      .map(r=>({title:r.title, salary:r.avg_salary}));

    /* ------- GPT + lưu ------- */
    const jobs = await analyseCareer({
      holland_profile : profile.holland_profile,
      knowdell_summary: profile.knowdell_summary,
      interests,
      shortlist,
    });

    await sb.from("career_profiles")
      .update({ suggested_jobs: jobs })
      .eq("user_id", user.id);

    return NextResponse.json({ jobs });
  } catch (e:any) {
    console.error("analyse error:",e);
    return NextResponse.json({error:e?.message||"500"}, {status:500});
  }
}
