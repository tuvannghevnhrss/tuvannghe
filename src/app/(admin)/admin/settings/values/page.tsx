import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listSettings } from "@/lib/admin/services/settings";
import SystemSettingsClient from "@/components/admin/settings/SystemSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsValuesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "settings", "view")) notFound();

  const settings = await listSettings();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-800">
        ← Cài đặt hệ thống
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Cấu hình hệ thống</h1>
      <p className="mt-1 text-sm text-slate-600">
        Kho key-value tuỳ ý. Hiện chưa có code nào đọc từ đây (chỉ <code>maintenance_mode</code> ở Feature Flags là
        đã nối thật) — dùng để chuẩn bị hạ tầng override giá/gói mà không cần deploy khi cần.
      </p>

      <div className="mt-6">
        <SystemSettingsClient initialSettings={settings} canEdit={can(admin.role, "settings", "full")} />
      </div>
    </div>
  );
}
