import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

export const runtime = "edge";          // chạy trên Edge

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { userId, content, threadId } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    /* ----- Supabase ----- */
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { headers: req.headers, cookies: { getAll() { return [] }, setAll() {} } }
    );

    /* 1. Tạo thread nếu chưa có */
    let tId = threadId as string | undefined;
    if (!tId) {
      const { data, error } = await supabase
        .from("threads")
        .insert({
          user_id: userId,
          title: content.split(" ").slice(0, 10).join(" "),
        })
        .select("id")
        .single();
      if (error) throw error;
      tId = data.id;
    }

    /* 2. Lưu tin nhắn user */
    await supabase.from("messages").insert({
      thread_id: tId,
      role: "user",
      content,
    });

    /* 3. Lấy lịch sử để gửi GPT */
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("thread_id", tId)
      .order("created_at", { ascending: true });

    /* 4. Gọi GPT-4o */
    const system =
      "Bạn là trợ lý Seven, chuyên tư vấn hướng nghiệp. " +
      "Nếu đây là tin nhắn đầu tiên trong đoạn chat hãy chào: " +
      "“Xin chào, tôi là trợ lý seven, tôi sẽ hỗ trợ bạn trong các vấn đề liên quan đến hướng nghiệp, nghề nghiệp”.";
    const messages = [
      { role: "system", content: system },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const answer = completion.choices[0].message.content ?? "";

    /* 5. Lưu tin nhắn assistant */
    await supabase.from("messages").insert({
      thread_id: tId,
      role: "assistant",
      content: answer,
    });

    return NextResponse.json({ threadId: tId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
