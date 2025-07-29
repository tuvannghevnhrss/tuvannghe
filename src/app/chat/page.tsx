import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ChatLayout from '@/components/ChatLayout';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* 1. Auth */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* 2. Lấy danh sách thread (có thể null) */
  const { data } = await supabase.rpc('v_chat_overview', { _user_id: user.id });

  // Luôn ép về mảng rỗng nếu null/undefined
  const threads = Array.isArray(data) ? data : [];

  /* 3. Thread đầu tiên (nếu có) */
  const firstId = threads[0]?.id ?? null;

  return (
    <ChatLayout
      threads={threads}
      initialThreadId={firstId}
      userId={user.id}
    />
  );
}
