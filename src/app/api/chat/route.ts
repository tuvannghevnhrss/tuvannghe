/* --------------------------------------------------------------------------
   /api/chat    –  GET  = lấy danh sách thread
                –  POST = gửi 1 tin nhắn (tạo thread mới nếu cần)
   -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/* -------------------- common helpers -------------------- */
async function mustAuthed() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw json({ error: 'UNAUTH' }, 401);
  return { supabase, user };
}

/* ==================== GET /api/chat ==================== */
export async function GET() {
  try {
    const { supabase, user } = await mustAuthed();

    const { data, error } = await supabase
      .rpc('v_chat_overview', { _user_id: user.id });   // view + RPC đã tạo

    if (error) {
      console.error(error);
      throw json({ error: 'DB_ERROR' }, 500);
    }
    return json(data ?? []);                            // luôn là mảng
  } catch (res) {
    return res as NextResponse;
  }
}

/* ==================== POST /api/chat =================== */
type Body = { thread_id?: string; message?: string };

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await mustAuthed();

    /* ---------- 1. body JSON an toàn ---------- */
    let body: Body;
    try {
      body = (await req.json()) ?? {};
    } catch {
      throw json({ error: 'BAD_JSON' }, 400);
    }

    const msg = body.message?.trim();
    if (!msg) throw json({ error: 'EMPTY' }, 400);

    /* ---------- 2. bảo đảm thread ---------- */
    let threadId = body.thread_id;
    if (!threadId) {
      const { data: t, error } = await supabase
        .from('chat_threads')
        .insert({ user_id: user.id, title: msg.slice(0, 60) })
        .select('id')
        .single();
      if (error) {
        console.error(error);
        throw json({ error: 'DB_ERROR' }, 500);
      }
      threadId = t.id;
    }

    /* ---------- 3. lưu tin nhắn của user ---------- */
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        user_id:   user.id,
        role:      'user',
        content:   msg,
      });
    if (msgErr) {
      console.error(msgErr);
      throw json({ error: 'DB_ERROR' }, 500);
    }

    /* ---------- 4. (tùy chọn) gọi OpenAI & lưu reply ---------- */
    // const ai = await chatWithGPT(msg);
    // await supabase.from('chat_messages').insert({ ... })

    return json({ ok: true, thread_id: threadId });
  } catch (res) {
    return res as NextResponse;
  }
}
