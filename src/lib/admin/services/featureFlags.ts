import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  rolloutPercent: number;
  description: string | null;
  updatedAt: string;
};

export async function listFeatureFlags(): Promise<FeatureFlagRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("feature_flags").select("*").order("key");
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(toRow);
}

export async function setFeatureFlag(
  input: { key: string; enabled: boolean; rolloutPercent?: number; description?: string | null },
  admin: AdminIdentity
): Promise<FeatureFlagRow> {
  const supabase = createSupabaseAdminClient();
  const key = input.key.trim();
  if (!key) throw new Error("INVALID_KEY");

  const { data: before } = await supabase.from("feature_flags").select("*").eq("key", key).maybeSingle();

  const { data, error } = await supabase
    .from("feature_flags")
    .upsert({
      key,
      enabled: input.enabled,
      rollout_percent: input.rolloutPercent ?? (before as any)?.rollout_percent ?? 100,
      description: input.description ?? (before as any)?.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: before ? "feature_flags.update" : "feature_flags.create",
    resourceType: "feature_flags",
    resourceId: key,
    before: before ?? null,
    after: data,
  });

  return toRow(data);
}

function toRow(r: any): FeatureFlagRow {
  return { key: r.key, enabled: r.enabled, rolloutPercent: r.rollout_percent, description: r.description, updatedAt: r.updated_at };
}
