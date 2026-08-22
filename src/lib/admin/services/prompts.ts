import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type PromptVersion = {
  id: string;
  key: string;
  version: number;
  module: string;
  template: string;
  variables: unknown;
  status: "draft" | "live" | "archived";
  createdAt: string;
};

export type PromptKeySummary = { key: string; module: string; liveVersion: number | null; versionCount: number };

export async function listPromptKeys(): Promise<PromptKeySummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("prompts").select("key, module, version, status").order("key");
  if (error) throw new Error(error.message);

  const byKey = new Map<string, PromptKeySummary>();
  for (const row of (data ?? []) as { key: string; module: string; version: number; status: string }[]) {
    const entry = byKey.get(row.key) ?? { key: row.key, module: row.module, liveVersion: null, versionCount: 0 };
    entry.versionCount += 1;
    if (row.status === "live") entry.liveVersion = row.version;
    byKey.set(row.key, entry);
  }
  return Array.from(byKey.values());
}

export async function getPromptVersions(key: string): Promise<PromptVersion[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("prompts").select("*").eq("key", key).order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(toPromptVersion);
}

export async function createPromptDraft(
  input: { key: string; module: string; template: string; variables?: unknown },
  admin: AdminIdentity
): Promise<PromptVersion> {
  const supabase = createSupabaseAdminClient();
  const key = input.key.trim();
  const template = input.template.trim();
  if (!key || !template) throw new Error("INVALID_INPUT");

  const { data: existing } = await supabase
    .from("prompts")
    .select("version")
    .eq("key", key)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((existing as { version: number } | null)?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      key,
      version: nextVersion,
      module: input.module || "general",
      template,
      variables: input.variables ?? [],
      status: "draft",
      created_by: admin.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "prompt.create_draft",
    resourceType: "prompts",
    resourceId: `${key}@${nextVersion}`,
    after: data,
  });

  return toPromptVersion(data);
}

export async function publishPromptVersion(id: string, admin: AdminIdentity): Promise<PromptVersion> {
  const supabase = createSupabaseAdminClient();
  const { data: target, error: targetErr } = await supabase.from("prompts").select("*").eq("id", id).maybeSingle();
  if (targetErr) throw new Error(targetErr.message);
  if (!target) throw new Error("PROMPT_NOT_FOUND");
  const t = target as any;

  // Archive bản live hiện tại của cùng key (nếu có) trước khi publish bản mới.
  await supabase.from("prompts").update({ status: "archived" }).eq("key", t.key).eq("status", "live");

  const { data, error } = await supabase.from("prompts").update({ status: "live" }).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "prompt.publish",
    resourceType: "prompts",
    resourceId: `${t.key}@${t.version}`,
    before: t,
    after: data,
  });

  return toPromptVersion(data);
}

function toPromptVersion(p: any): PromptVersion {
  return {
    id: p.id,
    key: p.key,
    version: p.version,
    module: p.module,
    template: p.template,
    variables: p.variables,
    status: p.status,
    createdAt: p.created_at,
  };
}
