import ChatLayout from '@/components/ChatLayout';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic'; // luôn fetch mới

export default async function ChatPage() {
  // ⬇️ Lấy user hiện tại
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) {
    // chuyển hướng đăng nhập
    return null;
  }

  // ⬇️ Lấy thread list + last message để hiển thị sidebar
  const { data: threads } = await supabaseServer
    .from('chat_threads')
    .select(`
      id,
      updated_at,
      messages:chat_messages(content)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <ChatLayout
      userId={user.id}
      threads={threads ?? []}
    />
  );
}
