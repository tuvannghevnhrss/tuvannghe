import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { publishPromptVersion } from "@/lib/admin/services/prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("prompts", "full");
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const version = await publishPromptVersion(id, auth.admin);
    return NextResponse.json({ data: version });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: { code: message } }, { status: message === "PROMPT_NOT_FOUND" ? 404 : 500 });
  }
}
