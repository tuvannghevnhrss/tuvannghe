import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listFeatureFlags } from "@/lib/admin/services/featureFlags";
import FeatureFlagsClient from "@/components/admin/settings/FeatureFlagsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsFlagsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "settings", "view")) notFound();

  const flags = await listFeatureFlags();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-800">
        ← Cài đặt hệ thống
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Feature Flags</h1>
      <p className="mt-1 text-sm text-slate-600">
        <code>maintenance_mode</code> khi bật sẽ chặn tạo giao dịch mới ở <code>/api/payments/checkout</code>.
      </p>

      <div className="mt-6">
        <FeatureFlagsClient initialFlags={flags} canEdit={can(admin.role, "settings", "full")} />
      </div>
    </div>
  );
}
