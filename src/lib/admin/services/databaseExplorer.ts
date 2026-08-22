import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

/**
 * Whitelist cứng trong code — bảng không nằm trong danh sách này không thể
 * truy cập qua Database Explorer dù biết tên bảng. 100% read-only ở M5:
 * ghi dữ liệu luôn đi qua module nghiệp vụ tương ứng (Payments, Questions,
 * Settings...) để đảm bảo validation + audit đúng ngữ nghĩa.
 */
export const EXPLORER_TABLES = [
  "profiles",
  "career_profiles",
  "payments",
  "coupons",
  "mbti_results",
  "holland_results",
  "knowdell_values",
  "knowdell_skills",
  "knowdell_interests",
  "lookup_values",
  "lookup_skills",
  "lookup_interests",
  "career_goal",
  "career_actions",
  "career_options",
  "chat_threads",
  "chat_messages",
  "job_postings",
  "interview_roles",
  "interview_difficulty_levels",
  "interview_experience_levels",
  "interview_questions",
  "interview_sessions_v2",
  "interview_answers",
  "interview_answer_feedback",
  "interview_session_feedback",
  "interview_tts_cache",
  "admin_users",
  "audit_logs",
  "ai_usage_logs",
  "prompts",
  "notifications",
  "system_settings",
  "feature_flags",
] as const;

export type ExplorerTable = (typeof EXPLORER_TABLES)[number];

export function isExplorerTable(v: string): v is ExplorerTable {
  return (EXPLORER_TABLES as readonly string[]).includes(v);
}

export async function browseTable(
  table: ExplorerTable,
  opts: { page?: number; pageSize?: number },
  admin: AdminIdentity
): Promise<{ rows: Record<string, unknown>[]; columns: string[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const page = opts.page ?? 1;
  const pageSize = Math.min(opts.pageSize ?? 30, 100);

  const { data, count, error } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);

  void writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "db_explorer.view",
    resourceType: table,
    resourceId: `page=${page}`,
  });

  const rows = (data ?? []) as Record<string, unknown>[];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns, total: count ?? 0 };
}

export async function exportTableCsv(table: ExplorerTable, admin: AdminIdentity, limit = 5000): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select("*").limit(limit);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "db_explorer.export",
    resourceType: table,
    resourceId: null,
  });

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [columns.join(","), ...rows.map((r) => columns.map((c) => escape(r[c])).join(","))];
  return lines.join("\n");
}
