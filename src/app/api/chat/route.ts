import { type NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";                  // Edge Function

// ---- khởi tạo OpenAI ----
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,          // đặt trong dashboard Vercel
});

export async function POST(req: NextRequest) {
  try {
    const { userId, content } = await req.json();

    if (typeof content !== "string" || !content.trim()) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",                    // hoặc model khác bạn có quyền dùng
      messages: [
        {
          role: "system",
          content:
            "Xin chào! Tôi là trợ lý hướng nghiệp. Cần tôi giúp gì cho bạn hôm nay?",
        },
        { role: "user", content },
      ],
    });

    return Response.json({
      answer: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
