import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { listSettings, upsertSetting } from "@/lib/admin/services/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin("settings", "view");
  if (auth.error) return auth.error;

  try {
    const rows = await listSettings();
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("settings", "full");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "").trim();
  if (!key || body?.value === undefined) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const row = await upsertSetting({ key, value: body.value, description: body.description || null }, auth.admin);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
