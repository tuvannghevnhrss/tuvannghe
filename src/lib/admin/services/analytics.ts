import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type FunnelStage = { label: string; count: number };

/**
 * Funnel tính trực tiếp từ bảng (không rollup định kỳ) — đủ nhanh ở quy mô
 * hiện tại. Khi dữ liệu lớn hơn, chuyển sang rollup theo cron (mục 25/27
 * tài liệu thiết kế).
 */
export async function getFunnel(): Promise<FunnelStage[]> {
  const supabase = createSupabaseAdminClient();

  const [signups, testUsers, paidUsers, completedInterviewUsers] = await Promise.all([
    countTotalSignups(supabase),
    countDistinctTestUsers(supabase),
    countDistinctUsers(supabase, "payments", (q) => q.eq("status", "paid")),
    countDistinctUsers(supabase, "interview_sessions_v2", (q) => q.eq("status", "completed")),
  ]);

  return [
    { label: "Đăng ký tài khoản", count: signups },
    { label: "Đã làm ít nhất 1 trắc nghiệm", count: testUsers },
    { label: "Đã thanh toán", count: paidUsers },
    { label: "Hoàn thành phỏng vấn AI", count: completedInterviewUsers },
  ];
}

async function countTotalSignups(supabase: AdminClient): Promise<number> {
  const { count } = await supabase.from("user_directory").select("user_id", { count: "exact", head: true });
  return count ?? 0;
}

async function distinctUserIdSet(supabase: AdminClient, table: string, filter?: (q: any) => any): Promise<Set<string>> {
  let query: any = supabase.from(table).select("user_id");
  if (filter) query = filter(query);
  const { data } = await query;
  return new Set(((data ?? []) as { user_id: string }[]).map((r) => r.user_id));
}

async function countDistinctUsers(supabase: AdminClient, table: string, filter?: (q: any) => any): Promise<number> {
  const set = await distinctUserIdSet(supabase, table, filter);
  return set.size;
}

async function countDistinctTestUsers(supabase: AdminClient): Promise<number> {
  const sets = await Promise.all([
    distinctUserIdSet(supabase, "mbti_results"),
    distinctUserIdSet(supabase, "holland_results"),
    distinctUserIdSet(supabase, "knowdell_values"),
    distinctUserIdSet(supabase, "knowdell_skills"),
    distinctUserIdSet(supabase, "knowdell_interests"),
  ]);
  const all = new Set<string>();
  for (const s of sets) for (const id of s) all.add(id);
  return all.size;
}

export type ProductPerformance = { product: string; revenue: number; paidCount: number };

export async function getProductPerformance(): Promise<ProductPerformance[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("payments").select("product, amount").eq("status", "paid");
  if (error) throw new Error(error.message);

  const map = new Map<string, ProductPerformance>();
  for (const row of (data ?? []) as { product: string; amount: number }[]) {
    const entry = map.get(row.product) ?? { product: row.product, revenue: 0, paidCount: 0 };
    entry.revenue += row.amount ?? 0;
    entry.paidCount += 1;
    map.set(row.product, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}
