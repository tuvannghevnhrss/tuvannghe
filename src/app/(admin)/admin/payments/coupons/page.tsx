import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listCoupons } from "@/lib/admin/services/payments";
import CouponForm from "@/components/admin/payments/CouponForm";
import DeleteCouponButton from "@/components/admin/payments/DeleteCouponButton";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "payments", "view")) notFound();

  const canEdit = can(admin.role, "payments", "full");
  const coupons = await listCoupons();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/payments" className="text-sm text-slate-500 hover:text-slate-800">
          ← Thanh toán
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Mã giảm giá</h1>
      </div>

      {canEdit && <CouponForm />}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Giảm giá</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Hết hạn</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">{c.discount.toLocaleString("vi-VN")}đ</td>
                <td className="px-4 py-3">{c.product ?? <span className="text-slate-400">Mọi sản phẩm</span>}</td>
                <td className="px-4 py-3 text-slate-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("vi-VN") : "—"}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <DeleteCouponButton code={c.code} />
                  </td>
                )}
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                  Chưa có mã giảm giá.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
