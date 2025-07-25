import { createSupabaseServerClient } from '@/lib/supabaseServer';

/** Tính điểm và gợi ý 5 nghề – kèm “reason” cho mỗi nghề */
export async function matchJobs(profile: any) {
  const supabase    = createSupabaseServerClient();
  const { data: jobs = [] } = await supabase.from('jobs').select('*');
  if (!jobs.length) return [];

  return jobs
    .map((j) => {
      let score = 0;
      const reasons: string[] = [];

      /* Holland – 40đ */
      if (profile.holland && j.holland_codes?.includes(profile.holland[0])) {
        score += 40;
        reasons.push(`Holland trùng **${profile.holland[0]}**`);
      }

      /* MBTI – 30đ */
      if (j.mbti_types?.includes(profile.mbti)) {
        score += 30;
        reasons.push(`MBTI trùng **${profile.mbti}**`);
      }

      /* Values – 1đ / value */
      const vMatch = j.top_values?.filter((v: string) => profile.values?.includes(v)) ?? [];
      if (vMatch.length) {
        score += vMatch.length;
        reasons.push(`Giá trị: ${vMatch.join(', ')}`);
      }

      /* Skills – love × pro */
      const sScore =
        profile.skills?.reduce(
          (s: number, k: any) => (j.top_skills?.includes(k.key) ? s + k.love * k.pro : s),
          0,
        ) ?? 0;
      if (sScore) {
        score += sScore;
        reasons.push('Kỹ năng thế mạnh phù hợp');
      }

      return { ...j, score, reason: reasons.join(' · ') };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
