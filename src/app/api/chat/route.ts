import { NextResponse } from "next/server";
import { ChatOpenAI } from "langchain/chat_models/openai";

/**
 * POST /api/chat
 * body: { content: string }
 */
export async function POST(req: Request) {
  // 🟢 Đọc JSON đúng 1 lần
  const { content } = await req.json().catch(() => ({}));

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  // --- gọi GPT-4o ---
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const reply = await llm.call([
    {
      role: "system",
      content:
        "Bạn là trợ lý hướng nghiệp huongnghiep.ai. Luôn mở đầu: 'Xin chào! Tôi là trợ lý hướng nghiệp. Cần tôi giúp gì cho bạn hôm nay?'",
    },
    { role: "user", content },
  ]);

  return NextResponse.json({ content: reply.content });
}
