import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserHealth } from "./userHealth";
import { getHealthForUsers } from "./user360";

/**
 * Cửa sổ user gần đây dùng cho Health-dependent insight (Cần hỗ trợ,
 * Users Needing Attention) — cùng lý do/đánh đổi như HEALTH_CANDIDATE_WINDOW
 * trong users.ts: tránh tính Health cho toàn bộ userbase mỗi lần tải
 * /admin. Metric khác (tổng user, active gần đây, đã mua, dùng interview,
 * funnel) chạy trên toàn bộ dữ liệu thật, không giới hạn cửa sổ này.
 */
const HEALTH_WINDOW = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

export type UserOverviewMetrics = {
  totalUsers: number;
  activeRecent7d: number;
  purchasedCount: number;
  usingInterviewCount: number;
  /** Tính trong cửa sổ HEALTH_WINDOW user gần nhất — không phải toàn bộ userbase */
  needsSupportCountRecentWindow: number;
  healthWindowSize: number;
};

export async function getUserOverviewMetrics(): Promise<UserOverviewMetrics> {
  const supabase = createSupabaseAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const [totalRes, activeRes, paidUsersRes, interviewUsersRes, windowRes] = await Promise.all([
    supabase.from("user_directory").select("user_id", { count: "exact", head: true }),
    supabase.from("user_directory").select("user_id", { count: "exact", head: true }).gte("last_sign_in_at", sevenDaysAgo),
    supabase.from("payments").select("user_id").eq("status", "paid"),
    supabase.from("interview_sessions_v2").select("user_id"),
    supabase
      .from("user_directory")
      .select("user_id, created_at, last_sign_in_at")
      .order("created_at", { ascending: false })
      .limit(HEALTH_WINDOW),
  ]);

  const purchasedCount = new Set((paidUsersRes.data ?? []).map((r) => r.user_id)).size;
  const usingInterviewCount = new Set((interviewUsersRes.data ?? []).map((r) => r.user_id)).size;

  const candidates = (windowRes.data ?? []) as { user_id: string; created_at: string; last_sign_in_at: string | null }[];
  const healthMap = await getHealthForUsers(
    candidates.map((c) => ({ userId: c.user_id, createdAt: c.created_at, lastSignInAt: c.last_sign_in_at }))
  );
  const needsSupportCountRecentWindow = Array.from(healthMap.values()).filter((h) => h.status === "needs_support").length;

  return {
    totalUsers: totalRes.count ?? 0,
    activeRecent7d: activeRes.count ?? 0,
    purchasedCount,
    usingInterviewCount,
    needsSupportCountRecentWindow,
    healthWindowSize: candidates.length,
  };
}

export type FunnelStep = { label: string; count: number };

export async function getUserFunnel(): Promise<FunnelStep[]> {
  const supabase = createSupabaseAdminClient();

  const [totalRes, careerRes, paymentsRes, sessionsRes] = await Promise.all([
    supabase.from("user_directory").select("user_id", { count: "exact", head: true }),
    supabase.from("career_profiles").select("user_id, mbti_type, holland_profile, knowdell"),
    supabase.from("payments").select("user_id").eq("status", "paid"),
    supabase.from("interview_sessions_v2").select("user_id, module_type"),
  ]);

  const career = careerRes.data ?? [];
  const mbtiCount = career.filter((c: any) => c.mbti_type).length;
  const hollandCount = career.filter((c: any) => c.holland_profile && Object.keys(c.holland_profile).length > 0).length;
  const knowdellCount = career.filter((c: any) => {
    const kb = c.knowdell ?? {};
    return (kb.values?.length ?? 0) || (kb.skills?.length ?? 0) || (kb.interests?.length ?? 0);
  }).length;

  const purchasedCount = new Set((paymentsRes.data ?? []).map((r) => r.user_id)).size;

  const sessions = sessionsRes.data ?? [];
  const interviewUserCount = new Set(sessions.map((s: any) => s.user_id)).size;
  const module1Count = new Set(sessions.filter((s: any) => s.module_type === 1).map((s: any) => s.user_id)).size;
  const module2Count = new Set(sessions.filter((s: any) => s.module_type === 3).map((s: any) => s.user_id)).size;
  const module3Count = new Set(sessions.filter((s: any) => s.module_type === 2).map((s: any) => s.user_id)).size;

  return [
    { label: "Đăng ký", count: totalRes.count ?? 0 },
    { label: "MBTI", count: mbtiCount },
    { label: "Holland", count: hollandCount },
    { label: "Giá trị bản thân", count: knowdellCount },
    { label: "Mua sản phẩm", count: purchasedCount },
    { label: "Interview", count: interviewUserCount },
    { label: "Module 1", count: module1Count },
    { label: "Module 2", count: module2Count },
    { label: "Module 3", count: module3Count },
  ];
}

export type AttentionItem = {
  userId: string;
  email: string | null;
  fullName: string | null;
  reason: string;
  health: UserHealth;
  lastActivityAt: string | null;
};

export async function getUsersNeedingAttention(limit = 8): Promise<AttentionItem[]> {
  const supabase = createSupabaseAdminClient();

  const { data: candidates } = await supabase
    .from("user_directory")
    .select("user_id, email, created_at, last_sign_in_at")
    .order("last_sign_in_at", { ascending: false, nullsFirst: false })
    .limit(HEALTH_WINDOW);

  const rows = (candidates ?? []) as { user_id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const [profilesRes, healthMap] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
    getHealthForUsers(rows.map((r) => ({ userId: r.user_id, createdAt: r.created_at, lastSignInAt: r.last_sign_in_at }))),
  ]);
  const fullNameByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p.full_name as string | null]));

  const severity: Record<string, number> = { needs_support: 0, stuck: 1, inactive: 2 };
  const items: AttentionItem[] = rows
    .map((r) => {
      const health = healthMap.get(r.user_id)!;
      return {
        userId: r.user_id,
        email: r.email,
        fullName: fullNameByUser.get(r.user_id) ?? null,
        reason: health.reason,
        health,
        lastActivityAt: r.last_sign_in_at,
      };
    })
    .filter((item) => item.health.status in severity)
    .sort((a, b) => severity[a.health.status] - severity[b.health.status])
    .slice(0, limit);

  return items;
}
