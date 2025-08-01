import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

/** Chạy trên Edge Runtime */
export const runtime = "edge";

/** Body validator – threadId giờ có thể null */
const Body = z.object({
  threadId: z.string().uuid().optional().nullable(),
  content : z.string().min(1),
  userId  : z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const supabase = createSupabaseServerClient();
  const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  /* (1) Bảo đảm có thread UUID */
  const threadId = body.threadId ?? crypto.randomUUID();

  /* (2) Đảm bảo thread tồn tại */
  await supabase
    .from("chat_threads")
    .upsert({ id: threadId, title: body.content.split(" ").slice(0, 10).join(" ") }, { onConflict: "id" });

  /* (3) Lưu message user */
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    role     : "user",
    content  : body.content,
    user_id  : body.userId,          // tùy bạn có dùng hay không
  });

  /* (4) Lấy history */
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  /* (5) Gọi GPT-4o-mini */
  const system =
    "Bạn là trợ lý Seven, chuyên tư vấn hướng nghiệp. " +
    "Nếu đây là tin nhắn đầu tiên hãy chào: " +
    "“Xin chào, tôi là trợ lý seven, tôi sẽ hỗ trợ bạn trong các vấn đề liên quan đến hướng nghiệp, nghề nghiệp”.";
  const completion = await openai.chat.completions.create({
    model   : "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
  });
  const assistantReply = completion.choices[0].message.content ?? "";

  /* (6) Lưu reply assistant */
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    role     : "assistant",
    content  : assistantReply,
  });

  return NextResponse.json({ assistantReply, threadId });
}
