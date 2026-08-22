import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { isLookupTable, listLookup, upsertLookup } from "@/lib/admin/services/lookups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const auth = await requireAdmin("questions", "view");
  if (auth.error) return auth.error;

  const { table } = await params;
  if (!isLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  try {
    const rows = await listLookup(table);
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const auth = await requireAdmin("questions", "edit");
  if (auth.error) return auth.error;

  const { table } = await params;
  if (!isLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "").trim();
  const vi = String(body?.vi ?? "").trim();
  if (!key || !vi) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const row = await upsertLookup(table, { key, vi, en: body?.en || null }, auth.admin);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
