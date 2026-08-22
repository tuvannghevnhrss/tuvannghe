import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export async function listAuditLogs(filters: {
  actorEmail?: string;
  action?: string;
  resourceType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ logs: AuditLogRow[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.actorEmail) query = query.ilike("actor_email", `%${filters.actorEmail}%`);
  if (filters.action) query = query.ilike("action", `%${filters.action}%`);
  if (filters.resourceType) query = query.eq("resource_type", filters.resourceType);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    logs: ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorEmail: r.actor_email,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      before: r.before,
      after: r.after,
      createdAt: r.created_at,
    })),
    total: count ?? 0,
  };
}

/** Danh sách resource_type để đổ vào dropdown lọc — quét 500 dòng gần nhất, đủ dùng ở quy mô hiện tại. */
export async function listAuditResourceTypes(): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("audit_logs").select("resource_type").order("created_at", { ascending: false }).limit(500);
  return Array.from(new Set(((data ?? []) as { resource_type: string }[]).map((r) => r.resource_type))).sort();
}
