import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import AdminJobsClient from "@/app/tuyendung/admin/AdminJobsClient";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "jobs", "view")) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tuyển dụng</h1>
      <p className="mt-1 text-sm text-slate-600">Tin ở trạng thái &quot;published&quot; hiển thị công khai tại /tuyendung.</p>
      <div className="mt-6">
        <AdminJobsClient basePath="/api/admin/jobs" />
      </div>
    </div>
  );
}
