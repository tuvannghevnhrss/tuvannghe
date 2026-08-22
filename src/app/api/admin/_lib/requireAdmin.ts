import { NextResponse } from "next/server";
import { createSupabaseRouteServerClient } from "@/lib/supabase/server";
import { getAdminUser, type AdminIdentity } from "@/lib/admin/getAdminUser";
import { can, type AdminModule, type PermLevel } from "@/lib/admin/permissions";

type RequireAdminResult = { admin: AdminIdentity; error?: undefined } | { admin?: undefined; error: NextResponse };

/**
 * Gate dùng chung cho mọi route dưới app/api/admin/*.
 * Khác với app/api/jobs/_lib/requireAdmin.ts (chỉ check allowlist email nhị phân),
 * hàm này check theo admin_users + ma trận quyền theo module.
 */
export async function requireAdmin(
  mod: AdminModule,
  required: Exclude<PermLevel, "none"> = "view"
): Promise<RequireAdminResult> {
  const supabase = await createSupabaseRouteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 }) };
  }

  const admin = await getAdminUser(supabase, user);
  if (!admin || !can(admin.role, mod, required)) {
    return { error: NextResponse.json({ error: { code: "PERMISSION_DENIED" } }, { status: 403 }) };
  }

  return { admin };
}
