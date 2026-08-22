import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserHealth, UserHealthStatus } from "./userHealth";
import { getHealthForUsers } from "./user360";

/** ✓ hoàn thành / ○ chưa bắt đầu / ● đang thực hiện (dùng cho Interview) */
export type JourneyStepState = "done" | "doing" | "none";

export type UserJourney = {
  mbti: JourneyStepState;
  holland: JourneyStepState;
  knowdell: JourneyStepState;
  interview: JourneyStepState;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  paidProducts: string[];
  usedInterview: boolean;
  journey: UserJourney;
  health: UserHealth | null;
};

type DirectoryRow = { user_id: string; email: string | null; created_at: string; last_sign_in_at: string | null };

export type UserListFilter = "all" | "healthy" | "new" | "inactive" | "stuck" | "needs_support" | "purchased" | "used_interview" | "attention";
export type UserListSort = "recent" | "last_active" | "name_asc" | "needs_attention";

const HEALTH_FILTERS: UserHealthStatus[] = ["healthy", "new", "inactive", "stuck", "needs_support"];
/** "attention" = filter tổng hợp dùng cho link "Xem tất cả →" từ Users Needing
 * Attention ở /admin — cùng tập trạng thái với getUsersNeedingAttention(). */
const ATTENTION_STATUSES: UserHealthStatus[] = ["needs_support", "stuck", "inactive"];

/**
 * Cửa sổ user "gần đây" dùng để tính Health/sort "cần hỗ trợ trước" mà không
 * phải quét toàn bộ userbase (có thể ~5.000 user) mỗi lần filter. Đây là
 * đánh đổi có chủ đích: filter/sort theo Health chỉ xét trong N user tạo
 * gần nhất hoặc đăng nhập gần nhất — đủ dùng cho "user cần chú ý gần đây",
 * không phải audit toàn bộ lịch sử user. Search/filter/sort khác (email,
 * đã mua, đã dùng Interview, mới nhất, tên A-Z) vẫn chạy 100% server-side
 * trên toàn bộ bảng, không bị giới hạn bởi cửa sổ này.
 */
const HEALTH_CANDIDATE_WINDOW = 500;

function toRow(u: DirectoryRow, fullName: string | null): Omit<AdminUserRow, "paidProducts" | "usedInterview" | "health" | "journey"> {
  return { id: u.user_id, email: u.email, fullName, createdAt: u.created_at, lastSignInAt: u.last_sign_in_at };
}

type CareerFlagsRow = { user_id: string; mbti_type: string | null; holland_profile: Record<string, number> | null; knowdell: { values?: unknown[]; skills?: unknown[]; interests?: unknown[] } | null };

/**
 * Cùng định nghĩa completion với user360.ts's getUserCareer() (nguồn:
 * career_profiles — KHÔNG dùng mbti_results/holland_results/knowdell_*, các
 * bảng đó không phải nguồn thật /profile đang đọc). Chỉ lấy boolean, không
 * lấy dict lookup_values/skills/interests vì cột Hành trình chỉ cần ✓/○.
 */
function buildJourneyMap(careerRows: CareerFlagsRow[], interviewUserIds: Set<string>): Map<string, UserJourney> {
  const byUser = new Map<string, CareerFlagsRow>(careerRows.map((c) => [c.user_id, c]));
  const map = new Map<string, UserJourney>();
  for (const [userId, c] of byUser) {
    const kb = c.knowdell ?? {};
    map.set(userId, {
      mbti: c.mbti_type ? "done" : "none",
      holland: c.holland_profile && Object.keys(c.holland_profile).length > 0 ? "done" : "none",
      knowdell: (kb.values?.length ?? 0) || (kb.skills?.length ?? 0) || (kb.interests?.length ?? 0) ? "done" : "none",
      interview: interviewUserIds.has(userId) ? "doing" : "none",
    });
  }
  return map;
}

const EMPTY_JOURNEY: UserJourney = { mbti: "none", holland: "none", knowdell: "none", interview: "none" };

function groupBy<T extends Record<string, any>>(rows: T[], key: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = row[key];
    const arr = map.get(k) ?? [];
    arr.push(row);
    map.set(k, arr);
  }
  return map;
}

export async function searchUsers(opts: {
  query?: string;
  page?: number;
  pageSize?: number;
  filter?: UserListFilter;
  sort?: UserListSort;
}): Promise<{ users: AdminUserRow[]; hasMore: boolean }> {
  const supabase = createSupabaseAdminClient();
  const pageSize = opts.pageSize ?? 20;
  const page = opts.page ?? 1;
  const q = opts.query?.trim();
  const filter = opts.filter ?? "all";
  const sort = opts.sort ?? "recent";

  const needsHealthComputation = HEALTH_FILTERS.includes(filter as UserHealthStatus) || filter === "attention" || sort === "needs_attention";

  if (needsHealthComputation) {
    return searchUsersWithHealth({ query: q, page, pageSize, filter, sort });
  }

  // ---- server-side path (không cần Health): search/filter/sort/paginate
  // trực tiếp trên toàn bộ bảng, không giới hạn cửa sổ. ----
  let purchasedIds: string[] | null = null;
  let interviewUserIds: string[] | null = null;

  if (filter === "purchased") {
    const { data } = await supabase.from("payments").select("user_id").eq("status", "paid");
    purchasedIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    if (purchasedIds.length === 0) return { users: [], hasMore: false };
  }
  if (filter === "used_interview") {
    const { data } = await supabase.from("interview_sessions_v2").select("user_id");
    interviewUserIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    if (interviewUserIds.length === 0) return { users: [], hasMore: false };
  }

  let query = supabase.from("user_directory").select("user_id, email, created_at, last_sign_in_at");

  if (q) query = query.ilike("email", `%${q}%`);
  if (purchasedIds) query = query.in("user_id", purchasedIds);
  if (interviewUserIds) query = query.in("user_id", interviewUserIds);

  if (sort === "last_active") query = query.order("last_sign_in_at", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const directoryRows = (data ?? []) as DirectoryRow[];
  const hasMore = directoryRows.length === pageSize;
  const ids = directoryRows.map((u) => u.user_id);

  const [profilesRes, paymentsRes, sessionsRes, careerRes] = await Promise.all([
    ids.length ? supabase.from("profiles").select("user_id, full_name").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? supabase.from("payments").select("user_id, product").eq("status", "paid").in("user_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from("interview_sessions_v2").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? supabase.from("career_profiles").select("user_id, mbti_type, holland_profile, knowdell").in("user_id", ids)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const fullNameByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p.full_name as string | null]));
  const paidByUser = groupBy((paymentsRes.data ?? []) as any[], "user_id");
  const interviewUserSet = new Set(((sessionsRes.data ?? []) as any[]).map((s) => s.user_id));
  const journeyByUser = buildJourneyMap((careerRes.data ?? []) as CareerFlagsRow[], interviewUserSet);

  // Health cho ĐÚNG trang đang hiển thị (≤ pageSize user, đã có id sẵn từ
  // query ở trên) — dùng chung getHealthForUsers() với mọi nơi khác (filter
  // theo Health, /admin Overview, User 360) nên luôn cùng 1 nguồn tính, cùng
  // kết quả cho cùng 1 user. Đây là batch .in()-style call, KHÔNG phải N+1:
  // trước đây nhánh này bỏ qua bước này hoàn toàn nên Health luôn hiển thị
  // "—" trên toàn bộ danh sách mặc định — đây chính là nguyên nhân được báo cáo.
  const baseRows = directoryRows.map((u) => toRow(u, fullNameByUser.get(u.user_id) ?? null));
  const healthMap = await getHealthForUsers(
    baseRows.map((u) => ({ userId: u.id, createdAt: u.createdAt, lastSignInAt: u.lastSignInAt }))
  );

  let users: AdminUserRow[] = baseRows.map((u) => ({
    ...u,
    paidProducts: (paidByUser.get(u.id) ?? []).map((p: any) => p.product),
    usedInterview: interviewUserSet.has(u.id),
    journey: journeyByUser.get(u.id) ?? EMPTY_JOURNEY,
    health: healthMap.get(u.id) ?? null,
  }));

  if (sort === "name_asc") {
    users = users.sort((a, b) => (a.fullName ?? a.email ?? "").localeCompare(b.fullName ?? b.email ?? ""));
  }

  return { users, hasMore };
}

/**
 * Nhánh dùng khi cần Health (filter theo trạng thái Health, hoặc sort "cần
 * hỗ trợ trước"). Tính trên cửa sổ HEALTH_CANDIDATE_WINDOW user gần nhất
 * (theo created_at) — xem giải thích ở HEALTH_CANDIDATE_WINDOW phía trên.
 */
async function searchUsersWithHealth(opts: {
  query?: string;
  page: number;
  pageSize: number;
  filter: UserListFilter;
  sort: UserListSort;
}): Promise<{ users: AdminUserRow[]; hasMore: boolean }> {
  const supabase = createSupabaseAdminClient();

  let candidateQuery = supabase
    .from("user_directory")
    .select("user_id, email, created_at, last_sign_in_at")
    .order("created_at", { ascending: false })
    .limit(HEALTH_CANDIDATE_WINDOW);
  if (opts.query) candidateQuery = candidateQuery.ilike("email", `%${opts.query}%`);

  const { data: candidates, error } = await candidateQuery;
  if (error) throw new Error(error.message);

  const directoryRows = (candidates ?? []) as DirectoryRow[];
  const ids = directoryRows.map((u) => u.user_id);
  if (ids.length === 0) return { users: [], hasMore: false };

  const [profilesRes, paymentsRes, sessionsRes, careerRes] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
    supabase.from("payments").select("user_id, product").eq("status", "paid").in("user_id", ids),
    supabase.from("interview_sessions_v2").select("user_id").in("user_id", ids),
    supabase.from("career_profiles").select("user_id, mbti_type, holland_profile, knowdell").in("user_id", ids),
  ]);
  const fullNameByUser = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p.full_name as string | null]));
  const paidByUser = groupBy((paymentsRes.data ?? []) as any[], "user_id");
  const interviewUserSet = new Set(((sessionsRes.data ?? []) as any[]).map((s) => s.user_id));
  const journeyByUser = buildJourneyMap((careerRes.data ?? []) as CareerFlagsRow[], interviewUserSet);

  const baseUsers = directoryRows.map((u) => toRow(u, fullNameByUser.get(u.user_id) ?? null));
  const healthMap = await getHealthForUsers(
    baseUsers.map((u) => ({ userId: u.id, createdAt: u.createdAt, lastSignInAt: u.lastSignInAt }))
  );

  let users: AdminUserRow[] = baseUsers.map((u) => ({
    ...u,
    paidProducts: (paidByUser.get(u.id) ?? []).map((p: any) => p.product),
    usedInterview: interviewUserSet.has(u.id),
    journey: journeyByUser.get(u.id) ?? EMPTY_JOURNEY,
    health: healthMap.get(u.id) ?? null,
  }));

  if (HEALTH_FILTERS.includes(opts.filter as UserHealthStatus)) {
    users = users.filter((u) => u.health?.status === opts.filter);
  } else if (opts.filter === "attention") {
    users = users.filter((u) => u.health && ATTENTION_STATUSES.includes(u.health.status));
  }

  // "attention" mặc định sắp theo mức độ nghiêm trọng ngay cả khi Admin chưa
  // tự chọn sort — đúng mục đích của link "Xem tất cả →" (user cấp bách nhất trước).
  if (opts.sort === "needs_attention" || opts.filter === "attention") {
    const severity: Record<UserHealthStatus, number> = { needs_support: 0, stuck: 1, inactive: 2, new: 3, healthy: 4, completed: 5 };
    users = users.sort((a, b) => severity[a.health?.status ?? "healthy"] - severity[b.health?.status ?? "healthy"]);
  }

  const start = (opts.page - 1) * opts.pageSize;
  const paged = users.slice(start, start + opts.pageSize);
  const hasMore = start + opts.pageSize < users.length;

  return { users: paged, hasMore };
}
