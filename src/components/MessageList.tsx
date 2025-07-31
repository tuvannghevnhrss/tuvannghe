'use client';

import useSWR from 'swr';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

async function fetchMessages(threadId: string | null) {
  if (!threadId) return [];
  const { data } = await supabaseBrowser
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export default function MessageList({ threadId }: { threadId: string | null }) {
  const { data: messages = [] } = useSWR(
    ['messages', threadId],
    () => fetchMessages(threadId),
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={m.role === 'user' ? 'text-right' : 'text-left'}
        >
          <div
            className={
              m.role === 'user'
                ? 'inline-block rounded bg-indigo-600 text-white px-3 py-2'
                : 'inline-block rounded bg-gray-100 px-3 py-2'
            }
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
