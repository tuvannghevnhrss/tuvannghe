/* src/app/chat/page.tsx – SERVER COMPONENT */
import ChatLayout from '@/components/ChatLayout';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* 1 — auth ------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* 2 — list threads --------------------------------------------- */
  const { data: threads } = await supabase
    .from('chat_threads')
    .select('id,title,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  /* 3 — render ---------------------------------------------------- */
  return (
    /* pt-12 ≈ 48 px => tránh đè lên navbar, h-[calc] giữ chiều cao   */
    <section className="pt-12 h-[calc(100vh-48px)]">
      <ChatLayout
        threads={threads ?? []}
        initialThreadId={null}
        userId={user.id}
      />
    </section>
  );
}
