/*  src/app/api/chat/route.ts
    POST  /api/chat
-------------------------------------------------- */
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createSupabaseRouteServerClient } from "@/lib/supabaseServer"

export const runtime = "edge"          // ⏩ dùng Edge Functions (rẻ & nhanh)

const openai = new OpenAI({
  apiKey : process.env.OPENAI_API_KEY,
})

/* ------------------- types ------------------- */
interface Body {
  userId   : string          // id người dùng Supabase
  content  : string          // tin nhắn người dùng
  threadId?: string          // id cuộc trò chuyện (nếu đã có)
}

/* ------------------- handler ------------------- */
export async function POST(req: Request) {
  const data = (await req.json()) as Body
  if (!data.userId || !data.content?.trim())
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  /* ----- Supabase ----- */
  const supabase = createSupabaseRouteServerClient()
  let threadId   = data.threadId

  // 1. Tạo thread mới nếu chưa có
  if (!threadId) {
    const { data: t, error } = await supabase
      .from("threads")
      .insert({ user_id: data.userId })
      .select("id")
      .single()
    if (error) return NextResponse.json({ error }, { status: 500 })
    threadId = t.id
  }

  // 2. Lưu message người dùng
  await supabase.from("messages").insert({
    thread_id: threadId,
    role     : "user",
    content  : data.content.trim(),
  })

  // 3. Lấy tối đa 15 message gần nhất làm bối cảnh
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(15)

  /* ----- gọi GPT-4o ----- */
  const messages = [
    {
      role    : "system",
      content :
        "Bạn là trợ lý hướng nghiệp AI. \
        Hãy trả lời bằng tiếng Việt, súc tích, dễ hiểu và thực tế.",
    },
    ...(history ?? []), // lịch sử cũ (đã bao gồm câu user vừa gửi)
  ]

  const completion = await openai.chat.completions.create({
    model    : "gpt-4o-mini",
    messages ,
    temperature: 0.7,
  })

  const assistant = completion.choices[0].message.content.trim()

  // 4. Lưu phản hồi AI
  await supabase.from("messages").insert({
    thread_id: threadId,
    role     : "assistant",
    content  : assistant,
  })

  /* ----- trả kết quả ----- */
  return NextResponse.json({ threadId, assistant })
}
