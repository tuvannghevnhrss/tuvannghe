import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { removeAdminUser, updateAdminUserRole } from "@/lib/admin/services/adminUsers";
import type { AdminRole } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin("settings", "full");
  if (auth.error) return auth.error;

  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const role = String(body?.role ?? "") as AdminRole;
  if (!role) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    await updateAdminUserRole(userId, role, auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    const status = message === "NOT_FOUND" ? 404 : message === "LAST_SUPER_ADMIN" ? 409 : message === "INVALID_ROLE" ? 422 : 500;
    return NextResponse.json({ error: { code: message } }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin("settings", "full");
  if (auth.error) return auth.error;

  const { userId } = await params;

  try {
    await removeAdminUser(userId, auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: { code: message } }, { status: message === "LAST_SUPER_ADMIN" ? 409 : 500 });
  }
}
