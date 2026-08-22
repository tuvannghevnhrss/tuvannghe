import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export const LOOKUP_TABLES = ["lookup_values", "lookup_skills", "lookup_interests"] as const;
export type LookupTable = (typeof LOOKUP_TABLES)[number];

export function isLookupTable(v: string): v is LookupTable {
  return (LOOKUP_TABLES as readonly string[]).includes(v);
}

const KEY_COLUMN: Record<LookupTable, string> = {
  lookup_values: "value_key",
  lookup_skills: "skill_key",
  lookup_interests: "interest_key",
};

export type LookupRow = { key: string; vi: string; en: string | null };

export async function listLookup(table: LookupTable): Promise<LookupRow[]> {
  const supabase = createSupabaseAdminClient();
  const keyCol = KEY_COLUMN[table];
  const { data, error } = await supabase.from(table).select("*").order(keyCol);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, any>[]).map((r) => ({ key: r[keyCol], vi: r.vi, en: r.en }));
}

export async function upsertLookup(
  table: LookupTable,
  input: { key: string; vi: string; en: string | null },
  admin: AdminIdentity
): Promise<LookupRow> {
  const supabase = createSupabaseAdminClient();
  const keyCol = KEY_COLUMN[table];
  const key = input.key.trim();
  if (!key) throw new Error("INVALID_KEY");

  const { data: before } = await supabase.from(table).select("*").eq(keyCol, key).maybeSingle();

  const { data, error } = await supabase
    .from(table)
    .upsert({ [keyCol]: key, vi: input.vi, en: input.en })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: before ? `${table}.update` : `${table}.create`,
    resourceType: table,
    resourceId: key,
    before: before ?? null,
    after: data,
  });

  const row = data as Record<string, any>;
  return { key: row[keyCol], vi: row.vi, en: row.en };
}

export async function deleteLookup(table: LookupTable, key: string, admin: AdminIdentity): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const keyCol = KEY_COLUMN[table];
  const { data: before } = await supabase.from(table).select("*").eq(keyCol, key).maybeSingle();
  if (!before) return;

  const { error } = await supabase.from(table).delete().eq(keyCol, key);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: `${table}.delete`,
    resourceType: table,
    resourceId: key,
    before,
    after: null,
  });
}
