import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

// ------------------------------------------------------------------
// Sessions monitor
// ------------------------------------------------------------------
export type SessionRow = {
  id: string;
  userId: string;
  moduleType: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
  roleId: string | null;
  jobTitle: string | null;
};

export async function listSessions(filters: {
  status?: string;
  moduleType?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ sessions: SessionRow[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;

  let query = supabase
    .from("interview_sessions_v2")
    .select("id, user_id, module_type, status, started_at, ended_at, role_id, job_title", { count: "exact" })
    .order("started_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.moduleType) query = query.eq("module_type", filters.moduleType);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    sessions: ((data ?? []) as any[]).map((s) => ({
      id: s.id,
      userId: s.user_id,
      moduleType: s.module_type,
      status: s.status,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      roleId: s.role_id,
      jobTitle: s.job_title,
    })),
    total: count ?? 0,
  };
}

export type SessionDetail = SessionRow & {
  answers: { id: string; promptText: string | null; transcript: string | null; durationSeconds: number | null }[];
  answerFeedback: { answerId: string; score: number | null; strengths: string[]; weaknesses: string[]; tips: string[] }[];
  sessionFeedback: {
    overallScore: number | null;
    communicationScore: number | null;
    contentScore: number | null;
    confidenceScore: number | null;
    summary: string | null;
    improvementPlan: string | null;
  } | null;
};

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase.from("interview_sessions_v2").select("*").eq("id", id).maybeSingle();
  if (!session) return null;

  const [answersRes, answerFeedbackRes, sessionFeedbackRes] = await Promise.all([
    supabase
      .from("interview_answers")
      .select("id, prompt_text, transcript, duration_seconds")
      .eq("session_id", id)
      .order("answer_index", { ascending: true }),
    supabase.from("interview_answer_feedback").select("answer_id, score, strengths, weaknesses, tips").eq("session_id", id),
    supabase.from("interview_session_feedback").select("*").eq("session_id", id).maybeSingle(),
  ]);

  const s = session as any;
  const sf = sessionFeedbackRes.data as any;

  return {
    id: s.id,
    userId: s.user_id,
    moduleType: s.module_type,
    status: s.status,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    roleId: s.role_id,
    jobTitle: s.job_title,
    answers: ((answersRes.data ?? []) as any[]).map((a) => ({
      id: a.id,
      promptText: a.prompt_text,
      transcript: a.transcript,
      durationSeconds: a.duration_seconds,
    })),
    answerFeedback: ((answerFeedbackRes.data ?? []) as any[]).map((f) => ({
      answerId: f.answer_id,
      score: f.score,
      strengths: f.strengths ?? [],
      weaknesses: f.weaknesses ?? [],
      tips: f.tips ?? [],
    })),
    sessionFeedback: sf
      ? {
          overallScore: sf.overall_score,
          communicationScore: sf.communication_score,
          contentScore: sf.content_score,
          confidenceScore: sf.confidence_score,
          summary: sf.summary,
          improvementPlan: sf.improvement_plan,
        }
      : null,
  };
}

// ------------------------------------------------------------------
// Roles / Difficulty / Experience lookup — CRUD dùng chung
// ------------------------------------------------------------------
export const INTERVIEW_LOOKUP_TABLES = [
  "interview_roles",
  "interview_difficulty_levels",
  "interview_experience_levels",
] as const;
export type InterviewLookupTable = (typeof INTERVIEW_LOOKUP_TABLES)[number];

export function isInterviewLookupTable(v: string): v is InterviewLookupTable {
  return (INTERVIEW_LOOKUP_TABLES as readonly string[]).includes(v);
}

export async function listInterviewLookup(table: InterviewLookupTable) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInterviewLookup(table: InterviewLookupTable, input: Record<string, unknown>, admin: AdminIdentity) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).insert(input).select("*").single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `${table}.create`,
    resourceType: table,
    resourceId: (data as any).id,
    after: data,
  });
  return data;
}

export async function updateInterviewLookup(
  table: InterviewLookupTable,
  id: string,
  input: Record<string, unknown>,
  admin: AdminIdentity
) {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  const { data, error } = await supabase.from(table).update(input).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `${table}.update`,
    resourceType: table,
    resourceId: id,
    before,
    after: data,
  });
  return data;
}

export async function deleteInterviewLookup(table: InterviewLookupTable, id: string, admin: AdminIdentity) {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (!before) return;

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `${table}.delete`,
    resourceType: table,
    resourceId: id,
    before,
    after: null,
  });
}
