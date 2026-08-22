import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { createChatCompletion } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("prompts", "full");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const template = String(body?.template ?? "").trim();
  const sampleMessage = String(body?.sampleMessage ?? "").trim();
  if (!template || !sampleMessage) return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: { code: "MISSING_OPENAI_KEY" } }, { status: 503 });
  }

  try {
    const completion = await createChatCompletion(
      {
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: template },
          { role: "user", content: sampleMessage },
        ],
      },
      { route: "admin.prompt_sandbox", userId: auth.admin.userId }
    );

    return NextResponse.json({ data: { output: completion.choices[0]?.message?.content ?? "" } });
  } catch (err) {
    return NextResponse.json({ error: { code: "CALL_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
