import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { createPromptDraft, listPromptKeys } from "@/lib/admin/services/prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin("prompts", "view");
  if (auth.error) return auth.error;

  try {
    const keys = await listPromptKeys();
    return NextResponse.json({ data: keys });
  } catch (err) {
    return NextResponse.json({ error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("prompts", "full");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const key = String(body?.key ?? "").trim();
  const template = String(body?.template ?? "").trim();
  if (!key || !template) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  try {
    const draft = await createPromptDraft(
      { key, module: body?.module || "general", template, variables: body?.variables },
      auth.admin
    );
    return NextResponse.json({ data: draft }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
