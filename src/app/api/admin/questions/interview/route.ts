import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { listInterviewQuestions, upsertInterviewQuestion } from "@/lib/admin/services/questions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin("questions", "view");
  if (auth.error) return auth.error;

  const roleId = req.nextUrl.searchParams.get("roleId") ?? undefined;
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");

  try {
    const result = await listInterviewQuestions({ roleId, page });
    return NextResponse.json({ data: result.questions, meta: { total: result.total } });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("questions", "edit");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  if (!content) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const question = await upsertInterviewQuestion(
      {
        id: body?.id || undefined,
        content,
        category: body?.category || null,
        roleId: body?.roleId || null,
        difficultyLevelId: body?.difficultyLevelId || null,
        experienceLevelId: body?.experienceLevelId || null,
        tags: Array.isArray(body?.tags) ? body.tags : [],
        idealAnswer: body?.idealAnswer || null,
      },
      auth.admin
    );
    return NextResponse.json({ data: question }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
