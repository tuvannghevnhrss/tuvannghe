/* --------------------------------------------------------------------------
   GET  /api/chat            → danh sách hội thoại
   GET  /api/chat?id=...     → toàn bộ tin nhắn của 1 hội thoại
   POST /api/chat            → tạo hội thoại mới  ➜ { id }
   POST /api/chat  { id, content }
                             → ghi 1 tin nhắn & trả về phản hồi GPT
----------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import OpenAI from 'openai';
import type { Database } from '@/types/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const dynamic = 'force-dynamic';
export const runtime  = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');

  /* ── 1. Lấy toàn bộ tin nhắn của 1 thread ── */
  if (id) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content')
      .eq('thread_id', id)
      .order('created_at');
    return NextResponse.json({ messages: data ?? [] });
  }

  /* ── 2. Trả danh sách hội thoại ── */
  const { data } = await supabase
    .from('chat_threads')
    .select(`
      id,
      title,
      last_msg:chat_messages(content),
      updated_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  /** rút gọn preview 40 kí tự đầu của tin cuối */
  const chats = (data ?? []).map(t => ({
    id       : t.id,
    title    : t.title ?? 'Chưa đặt tên',
    last_msg : (t.last_msg?.[0]?.content ?? '').slice(0, 40),
    updated  : t.updated_at,
  }));

  return NextResponse.json({ chats });
}

/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = null;
  try { body = await req.json(); } catch (_) {/* POST rỗng ⇒ tạo chat */}

  /* ── 1. Không body ⇒ tạo thread mới ── */
  if (!body || !body.id) {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user.id })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    return NextResponse.json({ id: data.id });
  }

  /* ── 2. Có id + content ⇒ ghi tin nhắn & gọi GPT ── */
  const { id, content } = body as { id: string; content: string };

  if (!content?.trim()) {
    return NextResponse.json({ error: 'EMPTY' }, { status: 400 });
  }

  /* Lưu tin nhắn user */
  await supabase.from('chat_messages').insert({
    thread_id: id,
    role     : 'user',
    content,
  });

  /* Gửi tới OpenAI – lấy context tối đa 10 msg gần nhất */
  const { data: recent } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('thread_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const messagesForAPI = (recent ?? [])
    .reverse()                              // chronological
    .map(m => ({ role: m.role, content: m.content }));

  messagesForAPI.unshift({
    role   : 'system',
    content: 'Bạn là trợ lý hướng nghiệp của ứng viên.',
  });

  const gpt = await openai.chat.completions.create({
    model       : 'gpt-4o-mini',
    temperature : 0.7,
    messages    : messagesForAPI,
  });

  const answer = gpt.choices[0].message.content.trim();

  /* Lưu assistant msg & cập nhật thread */
  const { data: save } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: id,
      role     : 'assistant',
      content  : answer,
    })
    .select('id')
    .single();

  await supabase
    .from('chat_threads')
    .update({
      title     : content.slice(0, 30) + (content.length > 30 ? '…' : ''),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return NextResponse.json({ id: save?.id, content: answer });
}
