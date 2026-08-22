import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { getUnreadNotificationCount } from "@/lib/admin/services/notifications";
import AdminSidebar from "@/components/admin/shell/AdminSidebar";
import Topbar from "@/components/admin/shell/Topbar";
import Breadcrumbs from "@/components/admin/shell/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const admin = await getAdminUser(supabase, user);
  if (!admin) notFound();

  const unreadNotifications = can(admin.role, "notifications", "view") ? await getUnreadNotificationCount() : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar role={admin.role} unreadNotifications={unreadNotifications} />
      <div className="flex flex-1 flex-col">
        <Topbar email={admin.email} role={admin.role} />
        <main className="flex-1 px-6 py-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
