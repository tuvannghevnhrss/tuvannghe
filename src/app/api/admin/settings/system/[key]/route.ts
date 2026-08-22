import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { deleteSetting } from "@/lib/admin/services/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireAdmin("settings", "full");
  if (auth.error) return auth.error;

  const { key } = await params;

  try {
    await deleteSetting(decodeURIComponent(key), auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: "DELETE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
