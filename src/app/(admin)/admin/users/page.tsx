import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { searchUsers, type UserListFilter, type UserListSort, type UserJourney, type JourneyStepState } from "@/lib/admin/services/users";
import type { UserHealth } from "@/lib/admin/services/userHealth";
import { HEALTH_DISPLAY } from "@/lib/admin/services/healthDisplay";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string; filter?: string; sort?: string }> };

const FILTERS: { value: UserListFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "attention", label: "⚠️ Cần chú ý" },
  { value: "healthy", label: "🟢 Hoạt động" },
  { value: "new", label: "🔵 Mới" },
  { value: "inactive", label: "🟡 Không hoạt động" },
  { value: "stuck", label: "🟠 Đang mắc kẹt" },
  { value: "needs_support", label: "🔴 Cần hỗ trợ" },
  { value: "purchased", label: "Đã mua sản phẩm" },
  { value: "used_interview", label: "Đã từng dùng Interview (mọi thời điểm)" },
];

const SORTS: { value: UserListSort; label: string }[] = [
  { value: "recent", label: "Mới nhất" },
  { value: "last_active", label: "Hoạt động gần nhất" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "needs_attention", label: "Cần hỗ trợ trước" },
];

const PAGE_SIZE = 25;

export default async function AdminUsersPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "users", "view")) notFound();

  const { q, page: pageStr, filter: filterStr, sort: sortStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const filter = (FILTERS.some((f) => f.value === filterStr) ? filterStr : "all") as UserListFilter;
  const sort = (SORTS.some((s) => s.value === sortStr) ? sortStr : "recent") as UserListSort;

  let users: Awaited<ReturnType<typeof searchUsers>>["users"] = [];
  let hasMore = false;
  let loadError: string | null = null;
  try {
    const result = await searchUsers({ query: q, page, pageSize: PAGE_SIZE, filter, sort });
    users = result.users;
    hasMore = result.hasMore;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "UNKNOWN_ERROR";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Người dùng</h1>
      <p className="mt-1 text-sm text-slate-600">Theo dõi hành trình và tình trạng sử dụng dịch vụ</p>

      <form className="mt-5 flex flex-wrap items-center gap-2" action="/admin/users">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Tìm theo email..."
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="filter" defaultValue={filter} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Áp dụng
        </button>
      </form>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Không tải được danh sách người dùng ({loadError}).
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Hành trình</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Hoạt động gần nhất</th>
                  <th className="px-4 py-3">Health</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-emerald-700 hover:underline">
                        {u.fullName || u.email || u.id}
                      </Link>
                      {u.fullName && <div className="text-xs text-slate-400">{u.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <JourneyRow journey={u.journey} />
                    </td>
                    <td className="px-4 py-3">
                      {u.paidProducts.length ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(u.paidProducts)).map((p) => (
                            <span key={p} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.lastSignInAt ? formatRelative(u.lastSignInAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <HealthCell health={u.health} />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      {q || filter !== "all" ? "Không tìm thấy người dùng." : "Không có người dùng phù hợp."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm">
            {page > 1 && (
              <Link href={`/admin/users?${qs({ q, filter, sort, page: page - 1 })}`} className="text-emerald-700 hover:underline">
                ← Trang trước
              </Link>
            )}
            {hasMore && (
              <Link href={`/admin/users?${qs({ q, filter, sort, page: page + 1 })}`} className="text-emerald-700 hover:underline">
                Trang sau →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const JOURNEY_STEPS: { key: keyof UserJourney; label: string }[] = [
  { key: "mbti", label: "MBTI" },
  { key: "holland", label: "Holland" },
  { key: "knowdell", label: "Giá trị" },
  { key: "interview", label: "Interview" },
];

const STEP_ICON: Record<JourneyStepState, string> = { done: "✓", doing: "●", none: "○" };
const STEP_CLASS: Record<JourneyStepState, string> = {
  done: "text-emerald-600",
  doing: "text-sky-600",
  none: "text-slate-300",
};

function JourneyRow({ journey }: { journey: UserJourney }) {
  const started = Object.values(journey).some((s) => s !== "none");
  if (!started) return <span className="text-xs text-slate-400">Chưa bắt đầu</span>;

  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs">
      {JOURNEY_STEPS.map((step, i) => (
        <span key={step.key} className="flex items-center gap-1">
          <span className={STEP_CLASS[journey[step.key]]}>
            {step.label} {STEP_ICON[journey[step.key]]}
          </span>
          {i < JOURNEY_STEPS.length - 1 && <span className="text-slate-300">→</span>}
        </span>
      ))}
    </div>
  );
}

function HealthCell({ health }: { health: UserHealth | null }) {
  // "—" chỉ khi thực sự thiếu dữ liệu để tính Health (ví dụ lỗi truy vấn) —
  // không phải trạng thái nghiệp vụ.
  if (!health) return <span className="text-slate-300">—</span>;

  const display = HEALTH_DISPLAY[health.status];
  return (
    <div className="max-w-[220px]">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${display.className}`}>
        {health.emoji} {display.label}
      </span>
      {display.showReason && <p className="mt-1 truncate text-xs text-slate-500" title={health.reason}>{health.reason}</p>}
    </div>
  );
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && v !== "all" && v !== "recent") sp.set(k, String(v));
  return sp.toString();
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
