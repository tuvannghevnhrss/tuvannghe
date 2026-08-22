import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfTodayVN(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const midnightVN = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  return new Date(midnightVN.getTime() - VN_OFFSET_MS).toISOString();
}

function startOfMonthVN(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const monthStartVN = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1));
  return new Date(monthStartVN.getTime() - VN_OFFSET_MS).toISOString();
}

function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * "Doanh thu hôm nay/tháng" phải tính theo lúc THỰC SỰ nhận tiền (paid_at),
 * không phải lúc tạo đơn (created_at) — 2 mốc này có thể lệch ngày quanh
 * nửa đêm. Đơn free (paid_at null, set thẳng status=paid lúc tạo) vẫn tính
 * theo created_at vì không có paid_at.
 */
function coalescePaidFilter(sinceISO: string): string {
  return `paid_at.gte.${sinceISO},and(paid_at.is.null,created_at.gte.${sinceISO})`;
}

export type DashboardKpis = {
  revenueToday: number;
  revenueMtd: number;
  paidCount7d: number;
  pendingCount7d: number;
  paymentSuccessRate: number | null;
  pendingOpenCount: number;
  newUsersToday: number;
  interviewActive: number;
  interviewFailed7d: number;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = createSupabaseAdminClient();
  const todayStart = startOfTodayVN();
  const monthStart = startOfMonthVN();
  const sevenDaysAgo = daysAgoISO(7);

  const [
    revenueTodayRes,
    revenueMtdRes,
    paid7dRes,
    pending7dRes,
    pendingOpenRes,
    interviewActiveRes,
    interviewFailedRes,
    newUsersToday,
  ] = await Promise.all([
    supabase.from("payments").select("amount").eq("status", "paid").or(coalescePaidFilter(todayStart)),
    supabase.from("payments").select("amount").eq("status", "paid").or(coalescePaidFilter(monthStart)),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "paid").gte("created_at", sevenDaysAgo),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending").gte("created_at", sevenDaysAgo),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("interview_sessions_v2").select("id", { count: "exact", head: true }).eq("status", "recording"),
    supabase
      .from("interview_sessions_v2")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", sevenDaysAgo),
    countNewUsersSince(supabase, todayStart),
  ]);

  const paidCount7d = paid7dRes.count ?? 0;
  const pendingCount7d = pending7dRes.count ?? 0;
  const totalAttempts7d = paidCount7d + pendingCount7d;

  return {
    revenueToday: sum(revenueTodayRes.data as { amount: number }[] | null),
    revenueMtd: sum(revenueMtdRes.data as { amount: number }[] | null),
    paidCount7d,
    pendingCount7d,
    paymentSuccessRate: totalAttempts7d > 0 ? paidCount7d / totalAttempts7d : null,
    pendingOpenCount: pendingOpenRes.count ?? 0,
    newUsersToday,
    interviewActive: interviewActiveRes.count ?? 0,
    interviewFailed7d: interviewFailedRes.count ?? 0,
  };
}

function sum(rows: { amount: number }[] | null): number {
  return (rows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
}

/** Đếm trực tiếp qua user_directory (đồng bộ từ auth.users bằng trigger). */
async function countNewUsersSince(supabase: ReturnType<typeof createSupabaseAdminClient>, sinceISO: string): Promise<number> {
  const { count } = await supabase.from("user_directory").select("user_id", { count: "exact", head: true }).gte("created_at", sinceISO);
  return count ?? 0;
}
