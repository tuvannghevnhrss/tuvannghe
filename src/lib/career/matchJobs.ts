/* ------------------------------------------------------------------ *
   Gợi ý 5 nghề phù hợp nhất từ bảng jobs
 * ------------------------------------------------------------------ */
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function suggestJobs (profile: any) {
  const supabase = createSupabaseServerClient();
  const { data: jobs = [] } = await supabase.from('jobs').select('*');
  if (!jobs.length) return [];

  return jobs
    .map((j: any) => {
      let score = 0, reasons: string[] = [];

      /* Holland ký tự đầu (40) */
      if (profile.holland_profile?.code?.[0] &&
          j.holland_codes?.includes(profile.holland_profile.code[0])) {
        score += 40;
        reasons.push(`Holland trùng **${profile.holland_profile.code[0]}**`);
      }

      /* MBTI (30) */
      if (j.mbti_types?.includes(profile.mbti_type)) {
        score += 30;
        reasons.push(`MBTI trùng **${profile.mbti_type}**`);
      }

      /* Knowdell values (1 đ / value) */
      const matched = (j.top_values ?? []).filter((v:string)=>
        profile.knowdell_profile?.values?.includes(v));
      score += matched.length;
      if (matched.length) reasons.push(`Giá trị: ${matched.join(', ')}`);

      return { id: j.id, title: j.title, score, reason: reasons.join(' · ') };
    })
    .sort((a,b)=> b.score - a.score)
    .slice(0,5);
}
