// -----------------------------------------------------------------------------
// src/lib/career/matchJobs.ts
// -----------------------------------------------------------------------------
import { createSupabaseServiceClient } from "@/lib/supabaseServer";

type Profile = {
  mbti: string | null;
  holland: string | null;
  values: string[];                    // Top personal values
  skills: { key: string; love: number; pro: number }[];
};

/** Trả về 5 job phù hợp + “lý do” (markdown ngắn gọn) */
export async function suggestJobs(profile: Profile) {
  const supabase = createSupabaseServiceClient();

  const { data: jobs = [] } = await supabase.from("jobs").select("*");
  if (!jobs.length) return [];

  return jobs
    .map((j) => {
      let score = 0;
      const reasons: string[] = [];

      /* Holland – khớp ký tự đầu (40đ) */
      if (profile.holland && j.holland_codes?.includes(profile.holland[0])) {
        score += 40;
        reasons.push(`Holland trùng **${profile.holland[0]}**`);
      }

      /* MBTI – khớp đủ 4 ký tự (30đ) */
      if (profile.mbti && j.mbti_types?.includes(profile.mbti)) {
        score += 30;
        reasons.push(`MBTI trùng **${profile.mbti}**`);
      }

      /* Values – 1 điểm mỗi value */
      const matchVal =
        j.top_values?.filter((v: string) => profile.values.includes(v)) ?? [];
      if (matchVal.length) {
        score += matchVal.length;
        reasons.push(`Giá trị: ${matchVal.join(", ")}`);
      }

      /* Skills – love × pro */
      const skillScore =
        profile.skills?.reduce(
          (s, k) =>
            j.top_skills?.includes(k.key) ? s + k.love * k.pro : s,
          0,
        ) ?? 0;
      if (skillScore) {
        score += skillScore;
        reasons.push("Kỹ năng thế mạnh phù hợp");
      }

      return { ...j, score, reason: reasons.join(" · ") };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
