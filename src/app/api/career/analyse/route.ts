import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { analyseKnowdell } from "@/lib/career/analyseKnowdell";

export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supa.auth.getSession();
  if (!session) return Response.json({ error: "Unauth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("refresh") === "1";

  /* lấy profile + cache + timestamps */
  const { data: profile } = await supa
    .from("v_career_profile")
    .select(
      "*, career_profiles(updated_at,analysis_markdown,analysis_updated_at)"
    )
    .eq("user_id", session.user.id)
    .single();

  if (!profile) return Response.json({ error: "No profile" }, { status: 404 });

  const profileTime   = new Date(profile.career_profiles.updated_at).getTime();
  const analysisTime  = profile.career_profiles.analysis_updated_at
    ? new Date(profile.career_profiles.analysis_updated_at).getTime()
    : 0;

  /* Nếu đã cache và hồ sơ CHƯA đổi & không ép refresh → trả cache */
  if (profile.career_profiles.analysis_markdown && !force && analysisTime >= profileTime) {
    return Response.json({ markdown: profile.career_profiles.analysis_markdown });
  }

  /* Lấy 20 title */
  const { data: kJobs } = await supa
    .from("knowdell_jobs")
    .select("title")
    .in("job_key", profile.knowdell_selected);

  const markdown = await analyseKnowdell({
    ...profile,
    selectedTitles: kJobs?.map((j) => j.title) ?? [],
  });

  /* lưu + timestamp mới */
  await supa
    .from("career_profiles")
    .update({
      analysis_markdown: markdown,
      analysis_updated_at: new Date().toISOString(),
    })
    .eq("user_id", session.user.id);

  return Response.json({ markdown });
}
