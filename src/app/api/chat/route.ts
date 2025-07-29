import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient }   from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });

  // ---- Lấy danh sách thread
  const { data, error } = await supabase.rpc('v_chat_overview', {
    _user_id: user.id,
  });
  if (error) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });

  return NextResponse.json(data);
}

/* -------------------------------------------------- */
/* POST  gửi message – tạo thread mới nếu cần         */
/* body = { thread_id?: string, message: string }      */
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });

  const { thread_id, message } = await req.json();

  // 1. Tạo thread mới nếu thiếu ID
  let t_id = thread_id;
  if (!t_id) {
    const { data: newThread, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user.id, title: message.slice(0, 60) })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    t_id = newThread.id;
  }

  // 2. Lưu message
  const { error: msgErr } = await supabase.from('chat_messages').insert({
    thread_id: t_id,
    user_id  : user.id,
    role     : 'user',
    content  : message,
  });
  if (msgErr) return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });

  /* ---- Gọi OpenAI & lưu phản hồi (bỏ qua chi tiết) ---- */

  return NextResponse.json({ thread_id: t_id });
}
