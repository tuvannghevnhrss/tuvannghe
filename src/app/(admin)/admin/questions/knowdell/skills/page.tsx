import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listLookup } from "@/lib/admin/services/lookups";
import LookupCrud from "@/components/admin/questions/LookupCrud";

export const dynamic = "force-dynamic";

export default async function AdminKnowdellSkillsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "questions", "view")) notFound();

  const rows = await listLookup("lookup_skills");

  return (
    <div>
      <Link href="/admin/questions" className="text-sm text-slate-500 hover:text-slate-800">
        ← Ngân hàng câu hỏi
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Knowdell — Kỹ năng</h1>
      <div className="mt-6">
        <LookupCrud table="lookup_skills" initialRows={rows} canEdit={can(admin.role, "questions", "edit")} />
      </div>
    </div>
  );
}
