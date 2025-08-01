import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "edge";          // chạy Edge Function trên Vercel

/* --------- validate body --------- */
const Body = z.object({
  threadId: z.string().optional().nullable(), // có thể null / undefined
  content : z.string().min(1, "message rỗng"),
  userId  : z.string().uuid().optional().nullable(),
});

/* regex nhận biết uuid v4 */
const isUUIDv4 = (s?: string | null) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  const body = Body.parse(await req.json());

  /* đảm bảo threadId hợp lệ */
  const threadId = isUUIDv4(body.threadId) ? body.threadId! : crypto.randomUUID();

  const supabase = createSupabaseServerClient();
  const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  /* upsert thread (tránh duplicate key) */
  await supabase
    .from("chat_threads")
    .upsert({ id: threadId, title: body.content.slice(0, 50) }, { onConflict: "id" });

  /* lưu message của user */
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    role     : "user",
    content  : body.content,
    user_id  : body.userId,
  });

  /* lấy toàn bộ lịch sử */
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at");

  /* gọi GPT-4o-mini */
  const completion = await openai.chat.completions.create({
    model   : "gpt-4o-mini",
    messages: [
      { role: "system", content: "Bạn là trợ lý Seven chuyên tư vấn hướng nghiệp." },
      ...(history ?? []).map((m) => ({
        role   : m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  const assistantReply = completion.choices[0].message.content ?? "";

  /* lưu phản hồi assistant */
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    role     : "assistant",
    content  : assistantReply,
  });

  return NextResponse.json({ assistantReply, threadId });
}
