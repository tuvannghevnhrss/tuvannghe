/* ------------------------------------------------------------------------- */
/*  /api/chat – Quản lý thread + message                                      */
/*    GET  :                                                                  */
/*      • /api/chat               ➜ danh sách thread của user (order desc)    */
/*      • /api/chat?id=THREAD_ID  ➜ toàn bộ message của thread                */
/*    POST :                                                                  */
/*      • body {}                      ➜ tạo thread mới, trả { id }           */
/*      • body { id, content }          ➜ lưu message & trả lại assistant msg */
/* ------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { cookies }                   from 'next/headers';
import { createRouteHandlerClient }  from '@supabase/auth-helpers-nextjs';
import OpenAI                        from 'openai';

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const SYSTEM  = 'Bạn là trợ lý hướng nghiệp thân thiện. Trả lời ngắn gọn.';

export const dynamic = 'force-dynamic';

/* ---------- helper: Supabase + user -------------------------------------- */
async function client() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('UNAUTHORIZED');
  return { supabase, uid: user.id };
}

/* ------------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { supabase, uid } = await client();
    const threadId = req.nextUrl.searchParams.get('id');

    if (threadId) {
      /* messages của 1 thread */
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ messages: data });
    }

    /* danh sách thread (lấy title + updated_at) */
    const { data, error } = await supabase
      .from('chat_threads')
      .select('id, title, updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ chats: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'DB_ERROR' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const { supabase, uid } = await client();
    const body = await (async () => {
      try { return await req.json(); }
      catch { return {}; } // request rỗng (tạo thread)
    })();

    /* --------- 1) TẠO THREAD MỚI --------------------------------------- */
    if (!body.id && !body.content) {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          user_id: uid,
          title  : 'Cuộc trò chuyện mới',
        })
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    /* --------- 2) LƯU TIN + TRẢ LỜI GPT -------------------------------- */
    const { id: threadId, content } = body as { id: string; content: string };
    if (!threadId || !content) throw new Error('BAD_REQUEST');

    /* 2.1 lưu tin user */
    const { error: insErr } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role     : 'user',
        content,
      });
    if (insErr) throw insErr;

    /* 2.2 lấy lại toàn bộ tin (<= 12) để bắn GPT làm context */
    const { data: ctx } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(12);

    const messages = [
      { role: 'system', content: SYSTEM },
      ...(ctx as { role: 'user' | 'assistant'; content: string }[]),
    ];

    const gpt = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages,
    });
    const assistant = gpt.choices[0].message.content.trim();

    /* 2.3 lưu tin assistant & update title */
    const [{ error: msgErr }, { error: updErr }] = await Promise.all([
      supabase.from('chat_messages').insert({
        thread_id: threadId,
        role     : 'assistant',
        content  : assistant,
      }),
      supabase.from('chat_threads')
        .update({ title: ctx?.[1]?.content?.slice(0, 60) ?? content.slice(0, 60) })
        .eq('id', threadId),
    ]);
    if (msgErr || updErr) throw (msgErr || updErr);

    return NextResponse.json({ id: crypto.randomUUID(), content: assistant });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'DB_ERROR' }, { status: 500 });
  }
}
