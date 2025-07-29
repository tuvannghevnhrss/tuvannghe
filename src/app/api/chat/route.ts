/* ------------------------------------------------------------------
   /api/chat   – GET = lấy tin nhắn, POST = tạo thread / gửi tin nhắn
   ------------------------------------------------------------------ */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient, type Database }
        from '@supabase/auth-helpers-nextjs';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });

  /* lấy tin nhắn của thread */
  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('id, role, content')
    .eq('thread_id', id)
    .order('created_at');

  return NextResponse.json({ messages: msgs ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // --------- an-toàn khi body rỗng hoặc không phải JSON ----------
  let body: any = {};
  if (req.headers.get('content-type')?.includes('application/json')) {
    try { body = await req.json(); } catch { /* body vẫn {} */ }
  }

  const { id: threadId, content } = body as {
    id?: string; content?: string;
  };

  /* 1 ▸ KHỞI TẠO THREAD (POST rỗng) ----------------------------- */
  if (!threadId && !content) {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user.id, title: 'Cuộc trò chuyện mới' })
      .select('id')
      .single();

    return error
      ? NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
      : NextResponse.json({ id: data.id });
  }

  /* 2 ▸ GỬI TIN NHẮN ------------------------------------------- */
  if (!threadId || !content?.trim())
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });

  // lưu tin nhắn của user
  const { error: e1 } = await supabase
    .from('chat_messages')
    .insert({ thread_id: threadId, user_id: user.id, role: 'user', content });

  if (e1) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });

  /* gọi OpenAI 💬 */
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      Authorization  : `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model   : 'gpt-3.5-turbo',
      messages: [{ role: 'user', content }],
    }),
  }).then(r => r.json());

  const assistantMsg = resp.choices?.[0]?.message?.content?.trim() ?? 'Xin lỗi, tôi gặp lỗi!';

  // lưu tin nhắn assistant
  const { data: msg, error: e2 } = await supabase
    .from('chat_messages')
    .insert({ thread_id: threadId, role: 'assistant', content: assistantMsg })
    .select('id')
    .single();

  if (e2) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });

  /* cập nhật timestamp thread */
  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date() })
    .eq('id', threadId);

  return NextResponse.json({ id: msg.id, content: assistantMsg });
}
