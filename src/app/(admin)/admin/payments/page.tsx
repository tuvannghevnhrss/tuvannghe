import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listPayments } from "@/lib/admin/services/payments";
import MarkPaidButton from "@/components/admin/payments/MarkPaidButton";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; product?: string; page?: string }> };

const STATUS_OPTIONS = ["paid", "pending"];
const PRODUCT_OPTIONS = ["mbti", "holland", "knowdell", "combo", "interview_starter", "interview_pro", "interview_premium"];

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "payments", "view")) notFound();

  const canEdit = can(admin.role, "payments", "full");
  const { status, product, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = 30;
  const { payments, total } = await listPayments({ status, product, page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
        {canEdit && (
          <Link href="/admin/payments/coupons" className="text-sm font-semibold text-emerald-700 hover:underline">
            Mã giảm giá →
          </Link>
        )}
      </div>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/payments">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="product" defaultValue={product ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Tất cả sản phẩm</option>
          {PRODUCT_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Lọc
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Số tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tạo lúc</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{p.orderCode ?? p.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.userId}`} className="font-medium text-emerald-700 hover:underline">
                    {p.product}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.amount.toLocaleString("vi-VN")}đ</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                {canEdit && <td className="px-4 py-3">{p.status !== "paid" && <MarkPaidButton paymentId={p.id} />}</td>}
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                  Không có giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <span>
          Trang {page}/{totalPages} · {total} giao dịch
        </span>
        {page > 1 && (
          <Link href={`/admin/payments?${qs({ status, product, page: page - 1 })}`} className="text-emerald-700 hover:underline">
            ← Trước
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/admin/payments?${qs({ status, product, page: page + 1 })}`} className="text-emerald-700 hover:underline">
            Sau →
          </Link>
        )}
      </div>
    </div>
  );
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  return sp.toString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
