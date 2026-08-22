import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { markNotificationRead } from "@/lib/admin/services/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("notifications", "edit");
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await markNotificationRead(id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: "UPDATE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
