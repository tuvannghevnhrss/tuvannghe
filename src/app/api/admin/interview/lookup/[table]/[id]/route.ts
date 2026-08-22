import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { deleteInterviewLookup, isInterviewLookupTable, updateInterviewLookup } from "@/lib/admin/services/interviewOps";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const auth = await requireAdmin("interview", "edit");
  if (auth.error) return auth.error;

  const { table, id } = await params;
  if (!isInterviewLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const input: Record<string, unknown> = {};
  if (body?.name !== undefined) input.name = String(body.name).trim();
  if (table === "interview_roles" && body?.slug !== undefined) input.slug = String(body.slug).trim();
  if ((table === "interview_experience_levels" || table === "interview_difficulty_levels") && body?.sortOrder !== undefined) {
    input.sort_order = Number(body.sortOrder) || 0;
  }

  if (Object.keys(input).length === 0) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const row = await updateInterviewLookup(table, id, input, auth.admin);
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const auth = await requireAdmin("interview", "full");
  if (auth.error) return auth.error;

  const { table, id } = await params;
  if (!isInterviewLookupTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  try {
    await deleteInterviewLookup(table, id, auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: "DELETE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
