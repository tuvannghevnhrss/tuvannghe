import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function suggestJobs(profile: any) {
  const supabase = createSupabaseServerClient();
  const { data: jobs = [] } = await supabase.from('jobs').select('*');
  if (!jobs.length) return [];

  return jobs
    .map((j) => {
      let score = 0;
      const reasons: string[] = [];

      /* Holland ký tự đầu (40) */
      if (profile.holland && j.holland_codes?.includes(profile.holland[0])) {
        score += 40;
        reasons.push(`Holland trùng **${profile.holland[0]}**`);
      }

      /* MBTI (30) */
      if (j.mbti_types?.includes(profile.mbti)) {
        score += 30;
        reasons.push(`MBTI trùng **${profile.mbti}**`);
      }

      /* Values (1/ value) */
      const matchVals =
        j.top_values?.filter((v: string) => profile.values?.includes(v)) ?? [];
      score += matchVals.length;
      if (matchVals.length) reasons.push(`Giá trị: ${matchVals.join(', ')}`);

      /* Skills (love*pro) */
      const sScore = profile.skills?.reduce(
        (s: number, k: any) =>
          j.top_skills?.includes(k.key) ? s + k.love * k.pro : s,
        0,
      ) ?? 0;
      score += sScore;
      if (sScore) reasons.push('Kỹ năng thế mạnh phù hợp');

      return { ...j, score, reason: reasons.join(' · ') };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
