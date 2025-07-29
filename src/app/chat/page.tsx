/* ------------------------------------------------------------------ */
/* /chat – tạo UI 2 cột: Lịch sử + Chat                              */
/* ------------------------------------------------------------------ */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient, type Database }
        from '@supabase/auth-helpers-nextjs';

import ChatLayout  from '@/components/ChatLayout';
import ChatShell   from '@/components/ChatShell';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* lấy danh sách thread của user (tiêu đề & last_message) -------- */
  const { data: threads } = await supabase
    .rpc('v_chat_overview', { _user_id: user.id });      // hàm RPC đã tạo

  /* thread đang mở = thread đầu tiên (nếu có) */
  const initialThreadId = threads?.[0]?.id ?? null;

  return (
    <ChatLayout threads={threads ?? []} initial={initialThreadId}>
      {/* nội dung + input */}
      <ChatShell threadId={initialThreadId} onThreadChange={() => {}} />
    </ChatLayout>
  );
}
