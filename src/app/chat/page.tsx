// -----------------------------------------------------------------------------
// src/app/chat/page.tsx   –  Server Component (Next 15)
// -----------------------------------------------------------------------------
import { cookies }                    from 'next/headers';
import { redirect }                   from 'next/navigation';      // <- chuyển sang next/navigation
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ChatLayout  from '@/components/ChatLayout';
import ChatShell   from '@/components/ChatShell';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* ---------- Cookie store ---------- */
  // cookies() bây giờ **đồng bộ** – KHÔNG được await
  const cookieStore = cookies();

  /* ---------- Supabase ---------- */
  const supabase = createServerComponentClient<Database>({
    // Supabase SDK yêu cầu truyền hàm trả về cookieStore
    cookies: () => cookieStore,
  });

  /* ---------- Auth ---------- */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirectedFrom=/chat');
  }

  /* ---------- Danh sách threads ---------- */
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

  const threads = (data ?? []).map(t => ({
    id      : t.id,
    title   : t.title ?? 'Chưa đặt tên',
    last_msg: (t.last_msg?.[0]?.content ?? '').slice(0, 40),
    updated : t.updated_at,
  }));

  /* ---------- Render ---------- */
  return (
    <ChatLayout threads={threads}>
      {/* ChatShell tự quyết định hiển thị khung Chat hoặc lịch sử tuỳ URL */}
      <ChatShell />
    </ChatLayout>
  );
}
