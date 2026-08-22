import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAuth";
import type { AdminRole } from "./permissions";

export type AdminIdentity = {
  userId: string;
  email: string | null;
  role: AdminRole;
  /** true nếu role được suy ra tạm thời từ ADMIN_EMAILS, chưa có bản ghi trong admin_users */
  bootstrap: boolean;
};

/**
 * Phân giải danh tính admin cho một user đã đăng nhập.
 * Dùng được từ middleware, layout, API route — miễn `supabase` là client
 * gắn với session của chính user đó (đọc admin_users qua RLS "read own row").
 */
export async function getAdminUser(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<AdminIdentity | null> {
  const { data } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.role) {
    return { userId: user.id, email: user.email ?? null, role: data.role as AdminRole, bootstrap: false };
  }

  if (isAdminEmail(user.email)) {
    return { userId: user.id, email: user.email ?? null, role: "super_admin", bootstrap: true };
  }

  return null;
}
