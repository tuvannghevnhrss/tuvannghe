import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CodeStat = { code: string; count: number };

function countBy<T>(rows: T[], keyFn: (r: T) => string | null | undefined): CodeStat[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r) || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getMbtiDistribution(): Promise<CodeStat[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("mbti_results").select("mbti_code");
  if (error) throw new Error(error.message);
  return countBy((data ?? []) as { mbti_code: string }[], (r) => r.mbti_code);
}

export async function getHollandDistribution(): Promise<CodeStat[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("holland_results").select("code");
  if (error) throw new Error(error.message);
  return countBy((data ?? []) as { code: string }[], (r) => r.code);
}

export async function getKnowdellCompletionCounts(): Promise<{ values: number; skills: number; interests: number }> {
  const supabase = createSupabaseAdminClient();
  const [v, s, i] = await Promise.all([
    supabase.from("knowdell_values").select("user_id"),
    supabase.from("knowdell_skills").select("user_id"),
    supabase.from("knowdell_interests").select("user_id"),
  ]);

  const uniq = (rows: { user_id: string }[] | null) => new Set((rows ?? []).map((r) => r.user_id)).size;

  return {
    values: uniq(v.data as { user_id: string }[] | null),
    skills: uniq(s.data as { user_id: string }[] | null),
    interests: uniq(i.data as { user_id: string }[] | null),
  };
}
