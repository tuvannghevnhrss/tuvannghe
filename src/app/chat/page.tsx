/* src/app/chat/page.tsx */
import { redirect } from 'next/navigation'
import ChatLayout from '@/components/ChatLayout'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'                  // luôn SSR, tránh cache

export default async function ChatPage() {
  const supabase = createSupabaseServerClient()

  /* ---- Lấy user ---- */
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  /* ---- Lấy threads + message cuối ---- */
  const { data: threads, error } = await supabase
    .from('chat_threads')
    .select(`
      id,
      updated_at,
      messages:chat_messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (
    <ChatLayout
      userId  ={user.id}
      threads ={threads ?? []}
    />
  )
}
