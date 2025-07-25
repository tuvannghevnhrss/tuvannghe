/* ------------------------------------------------------------------------- *
   TÍNH ĐIỂM & CHỌN TOP-5 NGHỀ PHÙ HỢP
   - Đọc bảng jobs   (RLS OFF → cần service-role key)
   - Trả về mảng [{ …job, score, reason }]
 * ------------------------------------------------------------------------- */

import { createSupabaseServiceRoleClient } from '@/lib/supabaseServer';

/*  Hàm chính – export named  */
export async function suggestJobs(profile: {
  mbti?: string;
  holland?: string;
  values?: string[];
  skills?: { key: string; love: number; pro: number }[];
}) {
  /* 1. Lấy danh sách nghề */
  const supabase = createSupabaseServiceRoleClient();
  const { data: jobs = [] } = await supabase.from('jobs').select('*');
  if (!jobs.length) return [];

  /* 2. Tính điểm cho từng nghề */
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

      /* Values (1 đ cho mỗi value khớp) */
      const vMatch =
        j.top_values?.filter((v: string) => profile.values?.includes(v)) ?? [];
      score += vMatch.length;
      if (vMatch.length) reasons.push(`Giá trị: ${vMatch.join(', ')}`);

      /* Skills (love × pro) */
      const sScore =
        profile.skills?.reduce(
          (s, k) =>
            j.top_skills?.includes(k.key) ? s + k.love * k.pro : s,
          0,
        ) ?? 0;
      score += sScore;
      if (sScore) reasons.push('Kỹ năng thế mạnh phù hợp');

      return { ...j, score, reason: reasons.join(' · ') };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // TOP-5
}

/* Alias để import { matchJobs } … */
export { suggestJobs as matchJobs };
