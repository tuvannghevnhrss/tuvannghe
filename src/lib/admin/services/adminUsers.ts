import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { searchUsers } from "@/lib/admin/services/users";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin/permissions";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type AdminUserRow = { userId: string; email: string | null; role: AdminRole; createdAt: string };

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("admin_users").select("*").order("created_at");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { user_id: string; role: AdminRole; created_at: string }[];
  const emails = await Promise.all(
    rows.map(async (r) => {
      const { data: u } = await supabase.auth.admin.getUserById(r.user_id);
      return u?.user?.email ?? null;
    })
  );

  return rows.map((r, i) => ({ userId: r.user_id, email: emails[i], role: r.role, createdAt: r.created_at }));
}

/** Tái dùng searchUsers() (query user_directory) để phân giải email -> userId. */
export async function addAdminUser(email: string, role: AdminRole, admin: AdminIdentity): Promise<AdminUserRow> {
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) throw new Error("INVALID_ROLE");

  const normalized = email.trim().toLowerCase();
  const { users } = await searchUsers({ query: normalized, pageSize: 5 });
  const match = users.find((u) => (u.email ?? "").toLowerCase() === normalized);
  if (!match) throw new Error("USER_NOT_FOUND");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .upsert({ user_id: match.id, role, created_by: admin.userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "admin_users.add",
    resourceType: "admin_users",
    resourceId: match.id,
    after: data,
  });

  return { userId: match.id, email: match.email, role, createdAt: (data as any).created_at };
}

export async function updateAdminUserRole(userId: string, role: AdminRole, admin: AdminIdentity): Promise<void> {
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) throw new Error("INVALID_ROLE");
  const supabase = createSupabaseAdminClient();

  const { data: before } = await supabase.from("admin_users").select("*").eq("user_id", userId).maybeSingle();
  if (!before) throw new Error("NOT_FOUND");

  if ((before as any).role === "super_admin" && role !== "super_admin") {
    await assertNotLastSuperAdmin(supabase, userId);
  }

  const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", userId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "admin_users.update_role",
    resourceType: "admin_users",
    resourceId: userId,
    before,
    after: { ...(before as object), role },
  });
}

export async function removeAdminUser(userId: string, admin: AdminIdentity): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("admin_users").select("*").eq("user_id", userId).maybeSingle();
  if (!before) return;

  if ((before as any).role === "super_admin") {
    await assertNotLastSuperAdmin(supabase, userId);
  }

  const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "admin_users.remove",
    resourceType: "admin_users",
    resourceId: userId,
    before,
    after: null,
  });
}

/** Không cho xoá/hạ quyền super_admin cuối cùng — tránh tự khoá quyền quản trị chính thức của cả team. */
async function assertNotLastSuperAdmin(supabase: ReturnType<typeof createSupabaseAdminClient>, excludingUserId: string) {
  const { count } = await supabase
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .neq("user_id", excludingUserId);
  if ((count ?? 0) === 0) throw new Error("LAST_SUPER_ADMIN");
}
