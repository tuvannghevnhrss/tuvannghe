// -----------------------------------------------------------------------------
// src/app/chat/page.tsx  –  SERVER COMPONENT
// -----------------------------------------------------------------------------
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ChatLayout   from '@/components/ChatLayout'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export default async function ChatPage(
  { searchParams }: { searchParams?: { thread?: string } }
) {
  /* 1 ▸ auth ------------------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectedFrom=/chat')

  /* 2 ▸ đọc query an-toàn ----------------------------------------- */
  const threadId = searchParams?.thread ?? null        // ← tránh destructure null

  /* 3 ▸ lấy danh sách thread -------------------------------------- */
  const { data: threads } = await supabase
    .rpc('v_chat_overview', { _user_id: user.id })     // view đã tạo
  // Nếu RPC trả null, biến threads = null → ép về []
  const overview = threads ?? []

  /* 4 ▸ lấy tin nhắn nếu có thread hiện hành ---------------------- */
  let messages: any[] = []
  if (threadId) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    messages = data ?? []
  }

  /* 5 ▸ render ----------------------------------------------------- */
  return (
    <ChatLayout
      userId={user.id}
      overview={overview}     // mảng { id, title, last_message, updated_at }
      initialThreadId={threadId}
      initialMessages={messages}
    />
  )
}
