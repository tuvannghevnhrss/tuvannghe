import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/** edge runtime */
export const runtime = "edge";

/** POST /api/chat/send */
export async function POST(req: NextRequest) {
  const { userId, content } = (await req.json()) as {
    userId: string | null;
    content: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });
  }

  /* --- call OpenAI (GPT-4o) --- */
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",                                  // GPT-4o
    messages: [
      { role: "system", content: "Bạn là trợ lý hướng nghiệp." },
      { role: "user", content },
    ],
  });

  const assistant = completion.choices[0].message.content ?? "";

  /* → trả về JSON đơn giản; không stream */
  return NextResponse.json({ assistant });
}
