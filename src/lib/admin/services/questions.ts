import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type InterviewQuestionRow = {
  id: string;
  content: string;
  category: string | null;
  roleId: string | null;
  difficultyLevelId: string | null;
  experienceLevelId: string | null;
  tags: string[];
  idealAnswer: string | null;
};

/**
 * interview_questions ở DB thật còn vài cột legacy (level_id, difficulty_id) không còn
 * được code hiện tại đọc/ghi — chỉ dùng role_id/difficulty_level_id/experience_level_id
 * (khớp với truy vấn thật ở app/api/interview/questions, app/api/interview/session/[id]).
 */
export async function listInterviewQuestions(filters: {
  roleId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ questions: InterviewQuestionRow[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;

  let query = supabase
    .from("interview_questions")
    .select("id, content, category, role_id, difficulty_level_id, experience_level_id, tags, ideal_answer", {
      count: "exact",
    })
    .order("id", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.roleId) query = query.eq("role_id", filters.roleId);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    questions: ((data ?? []) as any[]).map((q) => ({
      id: q.id,
      content: q.content,
      category: q.category,
      roleId: q.role_id,
      difficultyLevelId: q.difficulty_level_id,
      experienceLevelId: q.experience_level_id,
      tags: q.tags ?? [],
      idealAnswer: q.ideal_answer,
    })),
    total: count ?? 0,
  };
}

export async function upsertInterviewQuestion(
  input: {
    id?: string;
    content: string;
    category: string | null;
    roleId: string | null;
    difficultyLevelId: string | null;
    experienceLevelId: string | null;
    tags: string[];
    idealAnswer: string | null;
  },
  admin: AdminIdentity
) {
  const supabase = createSupabaseAdminClient();
  const payload = {
    content: input.content,
    category: input.category,
    role_id: input.roleId,
    difficulty_level_id: input.difficultyLevelId,
    experience_level_id: input.experienceLevelId,
    tags: input.tags,
    ideal_answer: input.idealAnswer,
  };

  if (input.id) {
    const { data: before } = await supabase.from("interview_questions").select("*").eq("id", input.id).maybeSingle();
    const { data, error } = await supabase.from("interview_questions").update(payload).eq("id", input.id).select("*").single();
    if (error) throw new Error(error.message);
    await writeAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "interview_questions.update",
      resourceType: "interview_questions",
      resourceId: input.id,
      before,
      after: data,
    });
    return data;
  }

  const { data, error } = await supabase.from("interview_questions").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "interview_questions.create",
    resourceType: "interview_questions",
    resourceId: (data as any).id,
    after: data,
  });
  return data;
}

export async function deleteInterviewQuestion(id: string, admin: AdminIdentity) {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("interview_questions").select("*").eq("id", id).maybeSingle();
  if (!before) return;

  const { error } = await supabase.from("interview_questions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "interview_questions.delete",
    resourceType: "interview_questions",
    resourceId: id,
    before,
    after: null,
  });
}
