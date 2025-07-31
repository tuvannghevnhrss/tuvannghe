/* src/app/chat/page.tsx */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ChatLayout from '@/components/ChatLayout';

/* luôn render phía server, tránh cache */
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* ---------- Tạo Supabase server-client ---------- */
  const cookieStore = cookies();                  // <— cookie của request
  const supabase   = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,        // URL
    process.env.SUPABASE_SERVICE_ROLE_KEY!,       // key server-side
    {
      global: {                                   // giữ phiên đăng nhập qua cookie
        fetch,                                   // dùng fetch mặc định của Next.js
        headers: { Cookie: cookieStore.toString() }
      }
    }
  );

  /* ---------- Lấy user hiện tại ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signup');                 // chưa đăng nhập → về /signup

  /* ---------- Lấy danh sách thread + tin nhắn cuối ---------- */
  const { data: threads } = await supabase
    .from('chat_threads')
    .select(
      `
        id,
        updated_at,
        messages:chat_messages!chat_threads_id_fkey (         -- FK
          id,
          role,
          content,
          created_at
        )
      `
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  /* ---------- Trả về giao diện ---------- */
  return (
    <ChatLayout
      userId   ={user.id}
      threads  ={threads ?? []}
    />
  );
}
