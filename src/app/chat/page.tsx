/* /chat  ─ Server component dựng dữ liệu & đẩy sang Client layout */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient, type Database }
        from '@supabase/auth-helpers-nextjs';

import ChatLayout from '@/components/ChatLayout';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* Lấy danh sách thread (RPC đã tạo ở DB) */
  const { data: threads } = await supabase
    .rpc('v_chat_overview', { _user_id: user.id });

  const firstId = threads?.[0]?.id ?? null;

  return <ChatLayout threads={threads ?? []} initial={firstId} />;
}
