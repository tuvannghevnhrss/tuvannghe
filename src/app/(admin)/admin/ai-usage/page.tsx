import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { AI_DAILY_BUDGET_USD, getAiUsageSummary, listRecentAiCalls } from "@/lib/admin/services/aiUsage";

export const dynamic = "force-dynamic";

export default async function AdminAiUsagePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "ai_usage", "view")) notFound();

  const [summary, recent] = await Promise.all([getAiUsageSummary(), listRecentAiCalls(30)]);
  const overBudget = summary.costToday > AI_DAILY_BUDGET_USD;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Chi phí AI</h1>

      {overBudget && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Chi phí AI hôm nay (${summary.costToday.toFixed(2)}) đã vượt ngưỡng ${AI_DAILY_BUDGET_USD}/ngày.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Chi phí hôm nay" value={`$${summary.costToday.toFixed(3)}`} />
        <Kpi label="Chi phí tháng này" value={`$${summary.costMtd.toFixed(2)}`} />
        <Kpi label="Số lượt gọi hôm nay" value={String(summary.callsToday)} />
        <Kpi label="Lượt lỗi hôm nay" value={String(summary.errorCallsToday)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BreakdownCard title="Theo tính năng (route)" rows={summary.byRoute.map((r) => ({ label: r.route, cost: r.cost, calls: r.calls }))} />
        <BreakdownCard title="Theo model" rows={summary.byModel.map((r) => ({ label: r.model, cost: r.cost, calls: r.calls }))} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Chi phí</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{c.route}</td>
                <td className="px-4 py-3 text-slate-600">{c.model}</td>
                <td className="px-4 py-3">${c.costUsd.toFixed(4)}</td>
                <td className="px-4 py-3 text-slate-500">{c.latencyMs != null ? `${c.latencyMs}ms` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Chưa có lượt gọi AI nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: { label: string; cost: number; calls: number }[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có dữ liệu hôm nay.</p>
      ) : (
        <div className="space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between border-t border-slate-100 py-1.5 first:border-t-0">
              <span className="font-mono text-slate-700">{r.label}</span>
              <span className="text-slate-500">
                ${r.cost.toFixed(4)} · {r.calls} lượt
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
