import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { createInterviewLookup, isInterviewLookupTable, listInterviewLookup } from "@/lib/admin/services/interviewOps";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const auth = await requireAdmin("interview", "view");
  if (auth.error) return auth.error;

  const { table } = await params;
  if (!isInterviewLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  try {
    const rows = await listInterviewLookup(table);
    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const auth = await requireAdmin("interview", "edit");
  if (auth.error) return auth.error;

  const { table } = await params;
  if (!isInterviewLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  const input: Record<string, unknown> = { name };
  if (table === "interview_roles" && body?.slug) input.slug = String(body.slug).trim();
  if ((table === "interview_experience_levels" || table === "interview_difficulty_levels") && body?.sortOrder !== undefined) {
    input.sort_order = Number(body.sortOrder) || 0;
  }

  try {
    const row = await createInterviewLookup(table, input, auth.admin);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
