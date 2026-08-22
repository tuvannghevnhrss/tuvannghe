import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type SettingRow = { key: string; value: unknown; description: string | null; updatedAt: string };

export async function listSettings(): Promise<SettingRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("system_settings").select("*").order("key");
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(toRow);
}

export async function upsertSetting(
  input: { key: string; value: unknown; description?: string | null },
  admin: AdminIdentity
): Promise<SettingRow> {
  const supabase = createSupabaseAdminClient();
  const key = input.key.trim();
  if (!key) throw new Error("INVALID_KEY");

  const { data: before } = await supabase.from("system_settings").select("*").eq("key", key).maybeSingle();

  const { data, error } = await supabase
    .from("system_settings")
    .upsert({
      key,
      value: input.value,
      description: input.description ?? null,
      updated_by: admin.userId,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: before ? "system_settings.update" : "system_settings.create",
    resourceType: "system_settings",
    resourceId: key,
    before: before ?? null,
    after: data,
  });

  return toRow(data);
}

export async function deleteSetting(key: string, admin: AdminIdentity): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("system_settings").select("*").eq("key", key).maybeSingle();
  if (!before) return;

  const { error } = await supabase.from("system_settings").delete().eq("key", key);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "system_settings.delete",
    resourceType: "system_settings",
    resourceId: key,
    before,
    after: null,
  });
}

function toRow(r: any): SettingRow {
  return { key: r.key, value: r.value, description: r.description, updatedAt: r.updated_at };
}
