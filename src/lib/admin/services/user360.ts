import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getInterviewAccess, DB_MODULE_TYPE, type AccessInfo } from "@/app/api/interview/_lib/access";
import {
  getFallbackExperienceName,
  getFallbackRoleName,
  getFallbackDifficultyName,
  normalizeVietnameseInterviewLabel,
} from "@/app/api/interview/_lib/data";
import { toText } from "@/lib/toText";
import { computeUserHealth, type UserHealth } from "./userHealth";

// ============================================================================
// HEADER
// ============================================================================
export type UserHeader = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function getUserHeader(userId: string): Promise<UserHeader | null> {
  const supabase = createSupabaseAdminClient();
  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !authUser?.user) return null;

  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).maybeSingle();

  return {
    id: userId,
    email: authUser.user.email ?? null,
    createdAt: authUser.user.created_at,
    lastSignInAt: authUser.user.last_sign_in_at ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

// ============================================================================
// CAREER JOURNEY (nguồn: career_profiles — KHÔNG dùng mbti_results/holland_results/
// knowdell_values/skills/interests, các bảng đó KHÔNG phải nguồn thật /profile
// đang đọc — xem PHASE 1 audit)
// ============================================================================
export type UserCareer = {
  hasMbti: boolean;
  mbtiCode: string | null;
  hasHolland: boolean;
  hollandCode: string | null;
  hollandRadar: { name: string; score: number }[];
  hasKnowdell: boolean;
  valuesVI: string[];
  skillsVI: string[];
  interestsVI: string[];
  hasSummary: boolean;
  knowdellSummary: string | null;
  suggestedJobs: unknown[];
  updatedAt: string | null;
  goal: { job: string | null; goals: string | null; what: string | null } | null;
  hasGoal: boolean;
  actionsCount: number;
  actionsDoneCount: number;
  hasPlan: boolean;
};

export async function getUserCareer(userId: string): Promise<UserCareer> {
  const supabase = createSupabaseAdminClient();

  const [profileRes, valuesRes, skillsRes, interestsRes, goalRes, actionsRes] = await Promise.all([
    supabase
      .from("career_profiles")
      .select("mbti_type, holland_profile, knowdell, knowdell_summary, suggested_jobs, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("lookup_values").select("value_key, vi"),
    supabase.from("lookup_skills").select("skill_key, vi"),
    supabase.from("lookup_interests").select("interest_key, vi"),
    supabase.from("career_goal").select("job, goals, what").eq("user_id", userId).maybeSingle(),
    supabase.from("career_actions").select("id, done").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const valueDict = toDict(valuesRes.data, "value_key");
  const skillDict = toDict(skillsRes.data, "skill_key");
  const interestDict = toDict(interestsRes.data, "interest_key");

  const kb = (profile?.knowdell as { values?: unknown; skills?: unknown; interests?: unknown }) ?? {};
  const valuesVI = toText(kb.values, [valueDict]);
  const skillsVI = toText(kb.skills, [skillDict]);
  const interestsVI = toText(kb.interests, [interestDict]);

  const hollandRadar: { name: string; score: number }[] = [];
  let hollandCode: string | null = null;
  if (profile?.holland_profile) {
    Object.entries(profile.holland_profile as Record<string, number>).forEach(([name, score]) => {
      hollandRadar.push({ name, score });
    });
    hollandCode = [...hollandRadar].sort((a, b) => b.score - a.score).slice(0, 3).map((i) => i.name).join("");
  }

  const actions = actionsRes.data ?? [];
  const goal = goalRes.data ?? null;

  return {
    hasMbti: Boolean(profile?.mbti_type),
    mbtiCode: profile?.mbti_type ?? null,
    hasHolland: Boolean(hollandCode),
    hollandCode,
    hollandRadar,
    hasKnowdell: Boolean(valuesVI.length || skillsVI.length || interestsVI.length),
    valuesVI,
    skillsVI,
    interestsVI,
    hasSummary: typeof profile?.knowdell_summary === "string" && profile.knowdell_summary.trim().length > 0,
    knowdellSummary: profile?.knowdell_summary ?? null,
    suggestedJobs: (profile?.suggested_jobs as unknown[]) ?? [],
    updatedAt: profile?.updated_at ?? null,
    goal,
    hasGoal: Boolean(goal?.job || goal?.goals),
    actionsCount: actions.length,
    actionsDoneCount: actions.filter((a) => a.done).length,
    hasPlan: actions.length > 0,
  };
}

function toDict<T extends Record<string, any>>(rows: T[] | null, key: keyof T): Record<string, string> {
  return Object.fromEntries((rows ?? []).map((row) => [row[key] as string, row.vi]));
}

// ============================================================================
// PRODUCTS (payments thật + entitlement công thức đã có + quota Interview
// TÁI SỬ DỤNG getInterviewAccess() nguyên vẹn, không tính lại)
// ============================================================================
export type PaymentRow = {
  id: number;
  product: string;
  amount: number;
  status: string;
  orderCode: string | null;
  promoCode: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type UserProducts = {
  payments: PaymentRow[];
  paidProductSet: Set<string>;
  havePaidCombo: boolean;
  interviewAccess: AccessInfo;
};

export async function getUserProducts(userId: string): Promise<UserProducts> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("id, product, amount, status, order_code, promo_code, created_at, paid_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const payments: PaymentRow[] = ((data ?? []) as any[]).map((p) => ({
    id: p.id,
    product: p.product,
    amount: p.amount,
    status: p.status,
    orderCode: p.order_code,
    promoCode: p.promo_code,
    createdAt: p.created_at,
    paidAt: p.paid_at,
  }));

  const paidProductSet = new Set(payments.filter((p) => p.status === "paid").map((p) => p.product));
  // Công thức đã thiết lập ở /profile/page.tsx — không tính lại theo cách khác.
  const havePaidCombo = ["holland", "knowdell"].every((p) => paidProductSet.has(p));

  const interviewAccess = await getInterviewAccess(userId);

  return { payments, paidProductSet, havePaidCombo, interviewAccess };
}

// ============================================================================
// INTERVIEW SUMMARY (cùng pattern AN TOÀN như /api/interview/dashboard —
// KHÔNG embed interview_roles/interview_experience_levels/interview_session_feedback
// trực tiếp trong .select() vì các FK đó không được PostgREST nhận diện,
// luôn 500 — xem ghi chú trong dashboard/route.ts)
// ============================================================================
export type InterviewSessionRow = {
  id: string;
  moduleType: number;
  role: string;
  level: string;
  difficulty: string;
  status: string;
  score: number | null;
  startedAt: string;
};

export type ModuleStat = {
  used: number;
  limit: number | "unlimited";
  remaining: number | null;
  sessionCount: number;
  averageScore: number | null;
};

export type UserInterviewSummary = {
  totalSessions: number;
  completedCount: number;
  failedCount: number;
  processingCount: number;
  /** status draft/recording — đang thực hiện, chưa gửi AI phân tích */
  draftOrRecordingCount: number;
  averageScore: number | null;
  latestScore: number | null;
  trend: number | null;
  perModule: Record<"module1" | "module2" | "module3", ModuleStat>;
  recentSessions: InterviewSessionRow[];
};

export async function getUserInterviewSummary(userId: string, access: AccessInfo): Promise<UserInterviewSummary> {
  const supabase = createSupabaseAdminClient();

  const { data: sessions } = await supabase
    .from("interview_sessions_v2")
    .select("id, module_type, status, started_at, role_id, experience_level_id, difficulty_level_id, config")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);

  const rows = sessions ?? [];
  const sessionIds = rows.map((r) => r.id);

  const feedbackBySessionId = new Map<string, { overall_score: number | null }>();
  if (sessionIds.length) {
    const { data: feedbackRows } = await supabase
      .from("interview_session_feedback")
      .select("session_id, overall_score")
      .in("session_id", sessionIds);
    for (const f of feedbackRows ?? []) feedbackBySessionId.set(f.session_id, f);
  }

  const completedScores = rows
    .filter((r) => r.status === "completed")
    .map((r) => Number(feedbackBySessionId.get(r.id)?.overall_score ?? 0))
    .filter((v) => v > 0);
  const averageScore = completedScores.length
    ? Math.round(completedScores.reduce((s, v) => s + v, 0) / completedScores.length)
    : null;
  const latestScore = completedScores.length ? completedScores[0] : null;
  const trend = completedScores.length > 1 ? completedScores[0] - completedScores[1] : null;

  const moduleKeys = ["module1", "module2", "module3"] as const;
  const perModule = {} as Record<(typeof moduleKeys)[number], ModuleStat>;
  for (const key of moduleKeys) {
    const dbType = DB_MODULE_TYPE[key];
    const moduleSessions = rows.filter((r) => r.module_type === dbType);
    const moduleCompletedScores = moduleSessions
      .filter((r) => r.status === "completed")
      .map((r) => Number(feedbackBySessionId.get(r.id)?.overall_score ?? 0))
      .filter((v) => v > 0);
    perModule[key] = {
      used: access.used[key],
      limit: access.limits[key],
      remaining: access.remaining[key],
      sessionCount: moduleSessions.length,
      averageScore: moduleCompletedScores.length
        ? Math.round(moduleCompletedScores.reduce((s, v) => s + v, 0) / moduleCompletedScores.length)
        : null,
    };
  }

  const recentSessions: InterviewSessionRow[] = rows.slice(0, 10).map((session) => {
    const sessionMeta = (
      session.config as { session_meta?: { roleName?: string; experienceLevelName?: string; difficultyName?: string } } | null
    )?.session_meta;
    const role = normalizeVietnameseInterviewLabel(
      sessionMeta?.roleName ?? getFallbackRoleName(session.role_id ?? undefined)
    ) || "Chưa xác định";
    const level = normalizeVietnameseInterviewLabel(
      sessionMeta?.experienceLevelName ?? getFallbackExperienceName(session.experience_level_id ?? undefined)
    ) || "Chưa xác định";
    const difficulty = normalizeVietnameseInterviewLabel(
      sessionMeta?.difficultyName ?? getFallbackDifficultyName(session.difficulty_level_id ?? undefined)
    ) || "Chưa xác định";
    return {
      id: session.id,
      moduleType: session.module_type,
      role,
      level,
      difficulty,
      status: session.status,
      score: Number(feedbackBySessionId.get(session.id)?.overall_score ?? 0) || null,
      startedAt: session.started_at,
    };
  });

  return {
    totalSessions: rows.length,
    completedCount: rows.filter((r) => r.status === "completed").length,
    failedCount: rows.filter((r) => r.status === "failed").length,
    processingCount: rows.filter((r) => r.status === "processing").length,
    draftOrRecordingCount: rows.filter((r) => r.status === "draft" || r.status === "recording").length,
    averageScore,
    latestScore,
    trend,
    perModule,
    recentSessions,
  };
}

// ============================================================================
// ACTIVITY TIMELINE — tổng hợp từ payments + interview_sessions_v2 +
// career_profiles.updated_at (KHÔNG có bảng audit/event riêng cho user —
// không tạo migration chỉ để làm timeline, đúng theo yêu cầu)
// ============================================================================
export type ActivityItem = {
  at: string;
  title: string;
  detail: string | null;
  kind: "account" | "payment" | "assessment" | "interview";
};

export async function getUserActivity(userId: string): Promise<ActivityItem[]> {
  const supabase = createSupabaseAdminClient();

  const [headerRes, paymentsRes, sessionsRes, careerRes] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase.from("payments").select("product, status, amount, created_at, paid_at").eq("user_id", userId),
    supabase
      .from("interview_sessions_v2")
      .select("id, module_type, status, started_at, ended_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(30),
    supabase.from("career_profiles").select("mbti_type, holland_profile, knowdell, updated_at").eq("user_id", userId).maybeSingle(),
  ]);

  const items: ActivityItem[] = [];

  if (headerRes.data?.user) {
    items.push({ at: headerRes.data.user.created_at, title: "Tạo tài khoản", detail: null, kind: "account" });
  }

  for (const p of paymentsRes.data ?? []) {
    if (p.status === "paid") {
      items.push({
        at: p.paid_at ?? p.created_at,
        title: `Mua ${p.product}`,
        detail: `${Number(p.amount).toLocaleString("vi-VN")}đ`,
        kind: "payment",
      });
    } else {
      items.push({ at: p.created_at, title: `Tạo đơn ${p.product} (chờ thanh toán)`, detail: null, kind: "payment" });
    }
  }

  for (const s of sessionsRes.data ?? []) {
    const moduleLabel = s.module_type === 1 ? "Module 1" : s.module_type === 3 ? "Module 2" : s.module_type === 2 ? "Module 3" : `Module ${s.module_type}`;
    if (s.status === "completed" && s.ended_at) {
      items.push({ at: s.ended_at, title: `Hoàn thành ${moduleLabel}`, detail: null, kind: "interview" });
    } else {
      items.push({ at: s.started_at, title: `Bắt đầu ${moduleLabel}`, detail: `Trạng thái: ${s.status}`, kind: "interview" });
    }
  }

  const cp = careerRes.data;
  if (cp?.updated_at) {
    const parts: string[] = [];
    if (cp.mbti_type) parts.push("MBTI");
    if (cp.holland_profile) parts.push("Holland");
    if (cp.knowdell) parts.push("Giá trị bản thân");
    if (parts.length) {
      items.push({ at: cp.updated_at, title: `Cập nhật kết quả: ${parts.join(", ")}`, detail: null, kind: "assessment" });
    }
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, 30);
}

// ============================================================================
// HEALTH SIGNALS — dùng chung cho User 360 (1 user) và users.ts/userInsights.ts
// (nhiều user cùng lúc, batch theo user_id) để không lặp lại logic gom tín
// hiệu ở 3 nơi khác nhau.
// ============================================================================
type HealthCandidate = { userId: string; createdAt: string; lastSignInAt: string | null };

export async function getHealthForUsers(candidates: HealthCandidate[]): Promise<Map<string, UserHealth>> {
  if (candidates.length === 0) return new Map();
  const supabase = createSupabaseAdminClient();
  const ids = candidates.map((c) => c.userId);

  const [paymentsRes, sessionsRes, careerRes] = await Promise.all([
    supabase.from("payments").select("user_id, product, status, created_at, paid_at").in("user_id", ids),
    supabase.from("interview_sessions_v2").select("user_id, status, started_at").in("user_id", ids),
    supabase.from("career_profiles").select("user_id, mbti_type, holland_profile, knowdell, updated_at").in("user_id", ids),
  ]);

  const paymentsByUser = new Map<string, any[]>();
  for (const p of paymentsRes.data ?? []) paymentsByUser.set(p.user_id, [...(paymentsByUser.get(p.user_id) ?? []), p]);
  const sessionsByUser = new Map<string, any[]>();
  for (const s of sessionsRes.data ?? []) sessionsByUser.set(s.user_id, [...(sessionsByUser.get(s.user_id) ?? []), s]);
  const careerByUser = new Map((careerRes.data ?? []).map((c: any) => [c.user_id, c]));

  const interviewProducts = ["interview_starter", "interview_pro", "interview_premium"];
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  const result = new Map<string, UserHealth>();
  for (const c of candidates) {
    const payments = paymentsByUser.get(c.userId) ?? [];
    const sessions = (sessionsByUser.get(c.userId) ?? []).sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
    const career = careerByUser.get(c.userId);

    const paidInterviewPayments = payments.filter((p) => p.status === "paid" && interviewProducts.includes(p.product));
    const latestInterviewPurchaseAt = paidInterviewPayments.length
      ? paidInterviewPayments.map((p) => p.paid_at ?? p.created_at).sort().reverse()[0]
      : null;
    const failedInterviewSessionCount14d = sessions.filter(
      (s) => s.status === "failed" && new Date(s.started_at).getTime() >= fourteenDaysAgo
    ).length;
    const hasStalePendingPayment = payments.some((p) => p.status === "pending" && new Date(p.created_at).getTime() < twentyFourHoursAgo);
    const activityDates = [
      c.lastSignInAt,
      ...payments.map((p) => p.paid_at ?? p.created_at),
      ...sessions.map((s) => s.started_at),
      career?.updated_at,
    ].filter((d): d is string => Boolean(d));
    const lastActivityAt = activityDates.length ? activityDates.sort().reverse()[0] : null;
    const kb = (career?.knowdell as { values?: unknown[]; skills?: unknown[]; interests?: unknown[] }) ?? {};

    result.set(
      c.userId,
      computeUserHealth({
        createdAt: c.createdAt,
        lastActivityAt,
        hasAnyPaidProduct: payments.some((p) => p.status === "paid"),
        hasPaidInterviewPackage: paidInterviewPayments.length > 0,
        latestInterviewPurchaseAt,
        totalInterviewSessionCount: sessions.length,
        completedInterviewSessionCount: sessions.filter((s) => s.status === "completed").length,
        failedInterviewSessionCount14d,
        latestInterviewSessionAt: sessions.length ? sessions[0].started_at : null,
        hasStalePendingPayment,
        hasCompletedMbti: Boolean(career?.mbti_type),
        hasCompletedHolland: Boolean(career?.holland_profile && Object.keys(career.holland_profile).length),
        hasCompletedKnowdell: Boolean((kb.values?.length ?? 0) || (kb.skills?.length ?? 0) || (kb.interests?.length ?? 0)),
      })
    );
  }
  return result;
}

export async function getUserHealthReport(userId: string): Promise<UserHealth> {
  const supabase = createSupabaseAdminClient();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const created = authUser?.user?.created_at ?? new Date().toISOString();
  const lastSignIn = authUser?.user?.last_sign_in_at ?? null;

  const map = await getHealthForUsers([{ userId, createdAt: created, lastSignInAt: lastSignIn }]);
  return (
    map.get(userId) ?? {
      status: "healthy",
      emoji: "🟢",
      label: "Bình thường",
      reason: "Đang sử dụng bình thường, không phát hiện vấn đề.",
    }
  );
}
