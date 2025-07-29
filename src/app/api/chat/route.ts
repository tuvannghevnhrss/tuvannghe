/* ----------------------------------------------------------------
   /api/chat   –   Chat hoàn chỉnh (Supabase + OpenAI)
   ---------------------------------------------------------------- */
import { NextRequest, NextResponse }   from 'next/server';
import { cookies }                     from 'next/headers';
import {
  createRouteHandlerClient,
  type Database,
} from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const dynamic = 'force-dynamic';     // chạy edge / node tuỳ Vercel
export const runtime  = 'nodejs';

/* ──────────────────────────────────────────────────────────────── */

type ThreadRow   = Database['public']['Tables']['chat_threads']['Row'];
type MessageRow  = Database['public']['Tables']['chat_messages']['Row'];

/** Lấy 25 tin nhắn mới nhất của 1 thread – theo chuẩn ChatGPT */
async function fetchMessages (
  supabase   : ReturnType<typeof createRouteHandlerClient>,
  threadId   : string,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) throw new Error('DB_ERROR');
  /* đảo ngược lại để push vào GPT */
  return (data ?? []).reverse();
}

/* ----------------------------------------------------------------
   POST  –  user gửi 1 tin nhắn
   body: { content: string, thread_id?: string }
   ---------------------------------------------------------------- */
export async function POST (req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED', messages: [] }, { status: 401 });
  }

  const { content, thread_id } = (await req.json()) as
    | { content: string; thread_id?: string }
    | undefined
    || {};

  if (!content?.trim()) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE', messages: [] }, { status: 400 });
  }

  let threadId = thread_id;

  /* 1 ▸ nếu chưa có thread ➜ tạo mới */
  if (!threadId) {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user.id, title: content.slice(0, 100) })
      .select('id')
      .single();

    if (error || !data) {
      console.error(error);
      return NextResponse.json({ error: 'DB_ERROR', messages: [] }, { status: 500 });
    }
    threadId = data.id;
  }

  /* 2 ▸ lưu message của user */
  const { error: insErr } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      user_id  : user.id,
      role     : 'user',
      content,
    });

  if (insErr) {
    console.error(insErr);
    return NextResponse.json({ error: 'DB_ERROR', messages: [] }, { status: 500 });
  }

  /* 3 ▸ lấy context & gọi GPT */
  const history = await fetchMessages(supabase, threadId);

  const completion = await openai.chat.completions.create({
    model       : 'gpt-4o-mini',
    temperature : 0.7,
    messages    : history.map(m => ({ role: m.role as any, content: m.content })),
  });

  const assistantMsg = completion.choices[0].message.content ?? '';

  /* 4 ▸ lưu assistant message */
  await supabase.from('chat_messages').insert({
    thread_id: threadId,
    user_id  : user.id,
    role     : 'assistant',
    content  : assistantMsg,
  });

  /* 5 ▸ trả về toàn bộ tin nhắn mới nhất */
  const fresh = await fetchMessages(supabase, threadId);

  return NextResponse.json({ thread_id: threadId, messages: fresh });
}

/* ----------------------------------------------------------------
   GET  –  lấy danh sách thread hoặc tin nhắn thread
   /api/chat?thread_id=xxx   ➜ tin nhắn
   /api/chat                ➜ danh sách thread
   ---------------------------------------------------------------- */
export async function GET (req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED', messages: [], chats: [] }, { status: 401 });
  }

  const threadId = req.nextUrl.searchParams.get('thread_id');

  /* ► lấy tin nhắn 1 thread */
  if (threadId) {
    try {
      const messages = await fetchMessages(supabase, threadId);
      return NextResponse.json({ messages });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: 'DB_ERROR', messages: [] }, { status: 500 });
    }
  }

  /* ► danh sách thread + tin nhắn mới nhất (dùng cho sidebar) */
  const { data, error } = await supabase
    .rpc('v_chat_overview', { _user_id: user.id })   // hoặc thay bằng JOIN
    /* view trả: id, last_msg, updated_at */

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB_ERROR', chats: [] }, { status: 500 });
  }

  return NextResponse.json({ chats: data ?? [] });
}

/* ----------------------------------------------------------------
   Fallback – luôn trả về mảng để FE không crash
   ---------------------------------------------------------------- */
export function handler () {
  return NextResponse.json({ messages: [], chats: [] });
}
