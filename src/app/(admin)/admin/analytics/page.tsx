import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { getFunnel, getProductPerformance } from "@/lib/admin/services/analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "analytics", "view")) notFound();

  const [funnel, products] = await Promise.all([getFunnel(), getProductPerformance()]);
  const maxFunnel = funnel[0]?.count || 1;
  const maxRevenue = Math.max(1, ...products.map((p) => p.revenue));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Tính trực tiếp từ dữ liệu hiện có (chưa rollup định kỳ). Chưa có cohort/retention theo tuần — sẽ bổ sung khi
          có hạ tầng rollup (xem mục 25/27 tài liệu thiết kế).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Funnel chuyển đổi</h2>
        <div className="space-y-4">
          {funnel.map((stage, i) => (
            <div key={stage.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  {i + 1}. {stage.label}
                </span>
                <span className="text-slate-500">
                  {stage.count}
                  {i > 0 && funnel[0].count > 0 && (
                    <span className="ml-1 text-xs text-slate-400">({Math.round((stage.count / funnel[0].count) * 100)}%)</span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(stage.count / maxFunnel) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Hiệu suất theo sản phẩm</h2>
        {products.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.product}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-mono font-medium text-slate-700">{p.product}</span>
                  <span className="text-slate-500">
                    {p.revenue.toLocaleString("vi-VN")}đ · {p.paidCount} lượt mua
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
