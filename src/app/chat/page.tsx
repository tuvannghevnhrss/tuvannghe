import ChatLayout, { ThreadMeta } from '@/components/ChatLayout';
import MessageList                from '@/components/MessageList';
import MessageInput               from '@/components/MessageInput';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

/* Tránh static-generate để luôn đọc cookie – fix 307 redirect & cookie-error */
export const dynamic = 'force-dynamic';

/* Lấy danh sách thread cho sidebar */
async function fetchThreads(): Promise<ThreadMeta[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('v_chat_overview')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[fetchThreads]', error);
    return [];
  }

  return (
    data ?? []
  ).map((row) => ({
    id:          row.id,
    title:       row.title       ?? 'Cuộc trò chuyện',
    updatedAt:   row.updated_at ?? row.created_at,
    lastMessage: row.last_message,
  }));
}

export default async function ChatPage() {
  const threads = await fetchThreads();

  return (
    <ChatLayout threads={threads}>
      <MessageList threads={threads} />
      <MessageInput />
    </ChatLayout>
  );
}
