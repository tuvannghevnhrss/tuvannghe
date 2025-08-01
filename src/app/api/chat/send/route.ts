import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

export const runtime = "edge";

// ----- validate body --------------------------------------------------------
const Body = z.object({
  threadId: z.string(),
  content : z.string().min(1),
  userId  : z.string().nullable(),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const supabase = createSupabaseServerClient();
  const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // 1) đảm bảo thread tồn tại – hoặc tạo mới
  let { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("id", body.threadId)
    .single();

  if (!thread) {
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ id: body.threadId, title: body.content.split(" ").slice(0, 10).join(" ") })
      .select("id")
      .single();
    if (error) throw error;
    thread = data;
  }

  // 2) lưu message user
  await supabase.from("chat_messages").insert({
    thread_id: thread.id,
    role     : "user",
    content  : body.content,
  });

  // 3) lấy history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  // 4) gọi GPT-4o-mini
  const system =
    "Bạn là trợ lý Seven, chuyên tư vấn hướng nghiệp. " +
    "Nếu đây là tin nhắn đầu tiên trong đoạn chat hãy chào: " +
    "“Xin chào, tôi là trợ lý seven, tôi sẽ hỗ trợ bạn trong các vấn đề liên quan đến hướng nghiệp, nghề nghiệp”.";
  const messages = [
    { role: "system", content: system },
    ...((history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))),
  ];

  const completion = await openai.chat.completions.create({
    model   : "gpt-4o-mini",
    messages,
  });

  const assistantReply = completion.choices[0].message.content ?? "";

  // 5) lưu message assistant
  await supabase.from("chat_messages").insert({
    thread_id: thread.id,
    role     : "assistant",
    content  : assistantReply,
  });

  return NextResponse.json({ assistantReply });
}
