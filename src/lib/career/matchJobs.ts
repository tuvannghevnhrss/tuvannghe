import { createClient } from "@supabase/supabase-js";

type Profile = {
  mbti: string;                 // "ESFJ"
  holland: string;              // "SER"
  values: string[];             // ["SOCIAL",...]
  skills: { key: string; love: number; pro: number }[];
  interests: string[];
};

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Tính điểm và trả về 5 nghề + lý do */
export async function suggestJobs(p: Profile) {
  const { data: jobs = [] } = await supa.from("jobs").select("*");

  /* nếu bảng rỗng → trả mảng trống cho UI xử lý */
  if (!jobs.length) return [];

  return jobs
    .map((j) => {
      const reasons: string[] = [];
      let score = 0;

      /* Holland khớp chữ cái đầu (40đ) */
      if (p.holland && j.holland_codes?.includes(p.holland[0])) {
        score += 40;
        reasons.push(`Holland trùng mã **${p.holland[0]}**`);
      }

      /* MBTI khớp (30đ) */
      if (j.mbti_types?.includes(p.mbti)) {
        score += 30;
        reasons.push(`MBTI trùng nhóm **${p.mbti}**`);
      }

      /* Value khớp (1đ mỗi value) */
      const valMatch = (j.top_values ?? []).filter((v: string) =>
        p.values.includes(v)
      );
      if (valMatch.length) {
        score += valMatch.length;
        reasons.push(`Giá trị: ${valMatch.join(", ")}`);
      }

      /* Skill khớp (love*pro) */
      const skillScore = p.skills.reduce(
        (s, k) =>
          (j.top_skills ?? []).includes(k.key) ? s + k.love * k.pro : s,
        0
      );
      if (skillScore) {
        score += skillScore;
        reasons.push("Kỹ năng thế mạnh phù hợp");
      }

      return { ...j, score, reason: reasons.join(" · ") };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
