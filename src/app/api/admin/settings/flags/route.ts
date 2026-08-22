import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { listFeatureFlags, setFeatureFlag } from "@/lib/admin/services/featureFlags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin("settings", "view");
  if (auth.error) return auth.error;

  try {
    const rows = await listFeatureFlags();
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
  if (!key || typeof body?.enabled !== "boolean") return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const row = await setFeatureFlag(
      { key, enabled: body.enabled, rolloutPercent: body?.rolloutPercent, description: body?.description },
      auth.admin
    );
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
