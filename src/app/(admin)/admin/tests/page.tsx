import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { getHollandDistribution, getKnowdellCompletionCounts, getMbtiDistribution } from "@/lib/admin/services/tests";

export const dynamic = "force-dynamic";

export default async function AdminTestsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "tests", "view")) notFound();

  const [mbti, holland, knowdell] = await Promise.all([
    getMbtiDistribution(),
    getHollandDistribution(),
    getKnowdellCompletionCounts(),
  ]);

  const mbtiTotal = mbti.reduce((s, r) => s + r.count, 0);
  const hollandTotal = holland.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trắc nghiệm nghề nghiệp</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thống kê kết quả. Nội dung câu hỏi (MBTI/Holland/Knowdell) quản lý ở{" "}
            <Link href="/admin/questions" className="font-semibold text-emerald-700 hover:underline">
              Ngân hàng câu hỏi
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard title={`MBTI — ${mbtiTotal} lượt làm`}>
          <Bars rows={mbti} total={mbtiTotal} />
        </StatCard>
        <StatCard title={`Holland — ${hollandTotal} lượt làm`}>
          <Bars rows={holland} total={hollandTotal} />
        </StatCard>
        <StatCard title="Knowdell — số người đã hoàn thành">
          <div className="space-y-2 text-sm">
            <Row label="Giá trị nghề nghiệp" value={knowdell.values} />
            <Row label="Kỹ năng" value={knowdell.skills} />
            <Row label="Sở thích" value={knowdell.interests} />
          </div>
        </StatCard>
      </div>
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Bars({ rows, total }: { rows: { code: string; count: number }[]; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.code} className="text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono font-semibold">{r.code}</span>
            <span className="text-slate-400">{r.count}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${total ? (r.count / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-1.5 first:border-t-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
