import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuditMeta = {
  actorId: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

/** Ghi 1 dòng audit log. Lỗi ghi log không được phép làm vỡ thao tác nghiệp vụ chính. */
export async function writeAuditLog(meta: AuditMeta & { after?: unknown }): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: meta.actorId,
    actor_email: meta.actorEmail,
    action: meta.action,
    resource_type: meta.resourceType,
    resource_id: meta.resourceId ?? null,
    before: meta.before ?? null,
    after: meta.after ?? null,
    ip: meta.ip ?? null,
    user_agent: meta.userAgent ?? null,
  });

  if (error) console.error("writeAuditLog failed:", error.message);
}

/** Chạy fn, ghi audit log với after = kết quả trả về, rồi trả kết quả đó ra như bình thường. */
export async function withAudit<T>(meta: AuditMeta, fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  await writeAuditLog({ ...meta, after: result });
  return result;
}
