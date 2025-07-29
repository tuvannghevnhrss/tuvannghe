/* ------------------------------------------------------------------ */
/*  /chat – server component dựng dữ liệu + bọc ChatLayout            */
/* ------------------------------------------------------------------ */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import ChatLayout, { type Thread } from '@/components/ChatLayout';
import ChatClient from '@/components/ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* ---------- auth ---------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* ---------- danh sách thread ---------- */
  const { data } = await supabase
    .from('chat_messages')
    .select('thread_id:id, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // gom theo thread & lấy tin mới nhất làm preview
  const map = new Map<string, Thread>();
  (data ?? []).forEach((m) => {
    if (!map.has(m.thread_id)) {
      map.set(m.thread_id, {
        id: m.thread_id,
        title: m.content.slice(0, 40) || 'Chat mới',
        last_msg: m.content,
        updated: m.created_at,
      });
    }
  });
  const threads = Array.from(map.values());

  /* ---------- render ---------- */
  return (
    <ChatLayout threads={threads}>
      <ChatClient />
    </ChatLayout>
  );
}
