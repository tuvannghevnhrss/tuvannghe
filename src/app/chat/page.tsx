/* ------------------------------------------------------------------ */
/*  /chat  – server component                                         */
/* ------------------------------------------------------------------ */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient }
        from '@supabase/auth-helpers-nextjs';
import ChatLayout from '@/components/ChatLayout';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  /* -------- AUTH -------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* -------- THREAD LIST -------- */
  const { data: threads = [] } = await supabase
    .from('chat_threads')
    .select('id,title,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <ChatLayout
      threads={threads}
      initialThreadId={threads[0]?.id ?? null}
      userId={user.id}
    />
  );
}
