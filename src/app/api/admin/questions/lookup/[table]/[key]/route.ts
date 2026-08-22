import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { deleteLookup, isLookupTable } from "@/lib/admin/services/lookups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ table: string; key: string }> }) {
  const auth = await requireAdmin("questions", "edit");
  if (auth.error) return auth.error;

  const { table, key } = await params;
  if (!isLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  try {
    await deleteLookup(table, decodeURIComponent(key), auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: "DELETE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
