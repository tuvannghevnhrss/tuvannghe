import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listInterviewQuestions } from "@/lib/admin/services/questions";
import InterviewQuestionsClient from "@/components/admin/questions/InterviewQuestionsClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsInterviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "questions", "view")) notFound();

  const canEdit = can(admin.role, "questions", "edit");
  const adminSupabase = createSupabaseAdminClient();

  const [{ questions }, rolesRes, difficultiesRes, experiencesRes] = await Promise.all([
    listInterviewQuestions({ pageSize: 100 }),
    adminSupabase.from("interview_roles").select("id, name").order("name"),
    adminSupabase.from("interview_difficulty_levels").select("id, name").order("name"),
    adminSupabase.from("interview_experience_levels").select("id, name").order("name"),
  ]);

  return (
    <div>
      <Link href="/admin/questions" className="text-sm text-slate-500 hover:text-slate-800">
        ← Ngân hàng câu hỏi
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Câu hỏi phỏng vấn AI</h1>

      <div className="mt-6">
        <InterviewQuestionsClient
          initialQuestions={questions}
          roles={(rolesRes.data ?? []) as { id: string; name: string }[]}
          difficulties={(difficultiesRes.data ?? []) as { id: string; name: string }[]}
          experiences={(experiencesRes.data ?? []) as { id: string; name: string }[]}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
