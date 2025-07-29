import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

/* ---------- GET: lấy danh sách thread ---------- */
export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });
  }

  const { data, error } = await supabase
    .rpc('v_chat_overview', { _user_id: user.id });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
  }

  return NextResponse.json(data);          // [{ id, title, last_message … }]
}

/* ---------- POST: gửi tin nhắn ---------- */
export async function POST(req: NextRequest) {
  let body: { thread_id?: string; message?: string };
  try { body = await req.json(); }          // tránh “Unexpected end of JSON”
  catch { return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 }); }

  if (!body?.message?.trim()) {
    return NextResponse.json({ error: 'EMPTY' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });

  /* 1. nếu chưa có thread → tạo thread mới */
  let threadId = body.thread_id;
  if (!threadId) {
    const { data: newThread, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user.id, title: body.message.slice(0, 60) })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    threadId = newThread.id;
  }

  /* 2. lưu tin nhắn của user */
  const { error: msgErr } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      user_id:   user.id,
      role:      'user',
      content:   body.message,
    });
  if (msgErr) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });

  /* 3. gọi OpenAI / xử lý chatbot ở đây … (giả sử đã có) */

  return NextResponse.json({ ok: true, thread_id: threadId });
}
