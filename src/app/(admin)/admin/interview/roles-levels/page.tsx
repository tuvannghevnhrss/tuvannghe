import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listInterviewLookup } from "@/lib/admin/services/interviewOps";
import InterviewLookupCrud from "@/components/admin/interview/InterviewLookupCrud";

export const dynamic = "force-dynamic";

export default async function AdminInterviewRolesLevelsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "interview", "view")) notFound();

  const canEdit = can(admin.role, "interview", "edit");
  const canDelete = can(admin.role, "interview", "full");

  const [roles, difficulties, experiences] = await Promise.all([
    listInterviewLookup("interview_roles"),
    listInterviewLookup("interview_difficulty_levels"),
    listInterviewLookup("interview_experience_levels"),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/interview" className="text-sm text-slate-500 hover:text-slate-800">
        ← Phỏng vấn AI
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Vai trò & Cấp độ</h1>
      <p className="mt-1 text-sm text-slate-600">Dùng làm bộ lọc câu hỏi ở Ngân hàng câu hỏi và lựa chọn khi user bắt đầu phỏng vấn.</p>

      <div className="mt-6 space-y-4">
        <InterviewLookupCrud
          table="interview_roles"
          title="Vai trò"
          initialRows={roles as any}
          hasSlug
          canEdit={canEdit}
          canDelete={canDelete}
        />
        <InterviewLookupCrud
          table="interview_difficulty_levels"
          title="Độ khó"
          initialRows={difficulties as any}
          hasSortOrder
          canEdit={canEdit}
          canDelete={canDelete}
        />
        <InterviewLookupCrud
          table="interview_experience_levels"
          title="Cấp kinh nghiệm"
          initialRows={experiences as any}
          hasSortOrder
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
