import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can, ROLE_LABEL } from "@/lib/admin/permissions";
import { getDashboardKpis } from "@/lib/admin/services/dashboard";
import { getAiUsageSummary } from "@/lib/admin/services/aiUsage";
import { checkOperationalAlerts } from "@/lib/admin/services/notifications";
import { getUserOverviewMetrics, getUserFunnel, getUsersNeedingAttention } from "@/lib/admin/services/userInsights";
import { HEALTH_DISPLAY } from "@/lib/admin/services/healthDisplay";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  const showAiCost = admin ? can(admin.role, "ai_usage", "view") : false;
  const showUsers = admin ? can(admin.role, "users", "view") : false;

  const [kpis, aiUsage, , userMetrics, funnel, attention] = await Promise.all([
    getDashboardKpis(),
    showAiCost ? getAiUsageSummary() : null,
    checkOperationalAlerts(),
    showUsers ? getUserOverviewMetrics() : null,
    showUsers ? getUserFunnel() : null,
    showUsers ? getUsersNeedingAttention(5) : null,
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Xin chào {admin?.email} — vai trò {admin ? ROLE_LABEL[admin.role] : "—"}.
      </p>

      {admin?.bootstrap && (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Vai trò này đang suy ra tạm thời từ <code>ADMIN_EMAILS</code> (chưa có bản ghi trong <code>admin_users</code>).
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi label="Doanh thu hôm nay" value={`${kpis.revenueToday.toLocaleString("vi-VN")}đ`} />
        <Kpi label="Doanh thu tháng này" value={`${kpis.revenueMtd.toLocaleString("vi-VN")}đ`} />
        <Kpi
          label="Tỉ lệ thanh toán thành công (7 ngày)"
          value={kpis.paymentSuccessRate === null ? "—" : `${Math.round(kpis.paymentSuccessRate * 100)}%`}
          sub={`${kpis.paidCount7d} paid / ${kpis.pendingCount7d} pending`}
        />
        <Kpi label="Giao dịch đang chờ xử lý" value={String(kpis.pendingOpenCount)} />
        <Kpi label="User mới hôm nay" value={String(kpis.newUsersToday)} />
        <Kpi label="Phiên phỏng vấn đang chạy" value={String(kpis.interviewActive)} />
        <Kpi label="Phiên phỏng vấn lỗi (7 ngày)" value={String(kpis.interviewFailed7d)} />
        {aiUsage && <Kpi label="Chi phí AI hôm nay" value={`$${aiUsage.costToday.toFixed(3)}`} sub={`${aiUsage.callsToday} lượt gọi`} />}
      </div>

      {userMetrics && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">User Overview</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Tổng người dùng" value={String(userMetrics.totalUsers)} />
            <Kpi label="Active gần đây (7 ngày)" value={String(userMetrics.activeRecent7d)} sub="Dựa trên đăng nhập" />
            <Kpi label="Đã mua sản phẩm" value={String(userMetrics.purchasedCount)} />
            <Kpi label="Đã dùng Interview" value={String(userMetrics.usingInterviewCount)} sub="Mọi thời điểm" />
            <Kpi
              label="Cần hỗ trợ"
              value={String(userMetrics.needsSupportCountRecentWindow)}
              sub={`Trong ${userMetrics.healthWindowSize} user gần nhất`}
            />
          </div>
        </section>
      )}

      {funnel && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">User Funnel</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex min-w-max items-stretch gap-2">
              {funnel.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="w-28 rounded-md bg-slate-50 p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">{step.count}</div>
                    <div className="text-xs text-slate-500">{step.label}</div>
                  </div>
                  {i < funnel.length - 1 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {attention && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Users Needing Attention</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400">Không phát hiện user nào cần chú ý.</p>
            ) : (
              attention.map((item) => (
                <Link
                  key={item.userId}
                  href={`/admin/users/${item.userId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {(item.fullName || item.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.fullName || item.email || item.userId}</p>
                    <p className="mt-0.5 text-xs">
                      <span className={`rounded-full px-1.5 py-0.5 font-medium ${HEALTH_DISPLAY[item.health.status].className}`}>
                        {item.health.emoji} {HEALTH_DISPLAY[item.health.status].label}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">&ldquo;{item.reason}&rdquo;</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-400">
                    <span>{item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleDateString("vi-VN") : "—"}</span>
                    <span className="font-medium text-emerald-700">Xem →</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href="/admin/users?filter=attention" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
            Xem tất cả →
          </Link>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
