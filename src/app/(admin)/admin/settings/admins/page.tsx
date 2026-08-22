import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listAdminUsers } from "@/lib/admin/services/adminUsers";
import AdminUsersClient from "@/components/admin/settings/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsAdminsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "settings", "view")) notFound();

  const admins = await listAdminUsers();

  return (
    <div>
      <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-800">
        ← Cài đặt hệ thống
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Quản lý Admin</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Người dùng phải đăng nhập ít nhất 1 lần trước khi thêm được vào đây. Tài khoản trong{" "}
        <code>ADMIN_EMAILS</code> vẫn có quyền <code>super_admin</code> tạm thời (bootstrap) dù chưa có ở bảng này —
        nên chuyển hẳn sang đây để không phụ thuộc biến môi trường.
      </p>

      <div className="mt-6">
        <AdminUsersClient initialAdmins={admins} currentUserId={admin.userId} />
      </div>
    </div>
  );
}
