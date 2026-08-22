import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { deleteInterviewQuestion } from "@/lib/admin/services/questions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("questions", "edit");
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await deleteInterviewQuestion(id, auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json({ error: { code: "DELETE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
