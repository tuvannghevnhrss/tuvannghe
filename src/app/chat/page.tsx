import { redirect } from 'next/navigation';
import ChatLayout from '@/components/ChatLayout';
import supabaseServer from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';   // tắt SSG để tránh lỗi prerender

export default async function ChatPage() {
  const supabase = supabaseServer();

  // ======= Kiểm tra đăng nhập =======
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signup');

  // ======= Lấy message =======
  const { data: messages = [] } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return <ChatLayout messages={messages} />;
}