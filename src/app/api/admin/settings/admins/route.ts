import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { addAdminUser, listAdminUsers } from "@/lib/admin/services/adminUsers";
import type { AdminRole } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin("settings", "view");
  if (auth.error) return auth.error;

  try {
    const rows = await listAdminUsers();
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("settings", "full");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim();
  const role = String(body?.role ?? "") as AdminRole;
  if (!email || !role) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const row = await addAdminUser(email, role, auth.admin);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    const status = message === "USER_NOT_FOUND" ? 404 : message === "INVALID_ROLE" ? 422 : 500;
    return NextResponse.json({ error: { code: message } }, { status });
  }
}
