import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

// prompt hệ thống: trả lời tiếng Việt
const systemPrompt =
  "Bạn là Trợ lý Seven, luôn trả lời NGẮN GỌN bằng tiếng Việt, thân thiện.";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const all = [{ role: "system", content: systemPrompt }, ...messages];

  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: all,
  });

  const enc = new TextEncoder();
  const readable = new ReadableStream({
    async pull(ctrl) {
      for await (const chunk of stream) {
        ctrl.enqueue(enc.encode(chunk.choices[0].delta?.content || ""));
      }
      ctrl.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
