// src/app/api/career/analyse/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/ssr";
import { analyseKnowdell }  from "@/lib/career/analyseKnowdell";
import { suggestJobs }      from "@/lib/career/matchJobs";

export const runtime = "edge";   // vẫn chạy Edge

export async function POST() {
  /* 1. khởi tạo supabase với cookie của request */
  const supabase = createRouteHandlerClient({ cookies });

  /* 2. kiểm tra user */
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user)
    return Response.json({ error: "AUTH" }, { status: 401 });

  /* 3. lấy profile */
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile)
    return Response.json({ error: "PROFILE_NOT_FOUND" }, { status: 400 });

  /* 4. GPT + gợi ý nghề */
  const [analysis, jobs] = await Promise.all([
    analyseKnowdell(profile),
    suggestJobs(profile),
  ]);

  /* 5. update DB */
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({
      knowdell_analysis: analysis,
      suggested_jobs: jobs,
    })
    .eq("id", profile.id);

  if (dbErr)
    return Response.json({ error: "DB_UPDATE" }, { status: 500 });

  return Response.json({ ok: true });
}
