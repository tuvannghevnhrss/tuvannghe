// -----------------------------------------------------------------------------
// src/app/api/career/analyse/route.ts  (Edge Runtime = "auto")
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { analyseKnowdell } from "@/lib/career/analyseKnowdell";
import { suggestJobs     } from "@/lib/career/matchJobs";
import { createSupabaseRouteServerClient }
        from "@/lib/supabaseServer";

export async function POST() {
  const supabase = createSupabaseRouteServerClient();

  /* 1️⃣  Lấy user + profile ------------------------------------------------- */
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "AUTH" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("career_profiles")
    .select(
      "id, mbti_type, holland_profile, knowdell_summary, suggested_jobs",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
  }

  /* 2️⃣  Ghép dữ liệu gọn gàng -------------------------------------------- */
  const payload = {
    mbti    : profile.mbti_type ?? null,
    holland : profile.holland_profile
      ? Object.entries(profile.holland_profile)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .map((e) => e[0])
          .join("")
      : null,
    ...(profile.knowdell_summary ?? { values: [], skills: [], interests: [] }),
  };

  /* 3️⃣  Gọi GPT (analyse) + match top 5 nghề ------------------------------ */
  const [markdown, jobs] = await Promise.all([
    analyseKnowdell(payload),
    suggestJobs(payload),
  ]);

  /* 4️⃣  Lưu thẳng vào profile -> khi F5 không cần gọi GPT lại ------------- */
  await supabase
    .from("career_profiles")
    .update({ knowdell_summary: payload, suggested_jobs: jobs, analysis_md: markdown })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true });
}
