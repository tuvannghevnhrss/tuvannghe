'use client';
import { useEffect, useState } from 'react';
import MessageList  from './MessageList';
import MessageInput from './MessageInput';

export type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatShell({
  threadId,
  onThreadChange,
}: {
  threadId: string | null;
  onThreadChange: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading , setLoading ] = useState(false);
  const [error   , setError   ] = useState<string | null>(null);

  /* tạo thread đầu tiên (khi chưa có) */
  useEffect(() => {
    if (threadId) return;
    (async () => {
      try {
        const { id } = await fetch('/api/chat', { method: 'POST' })
                              .then(r => r.json());
        onThreadChange(id);
      } catch { setError('DB_ERROR'); }
    })();
  }, [threadId, onThreadChange]);   // <── thêm onThreadChange

  /* nạp tin nhắn khi threadId đổi */
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      setLoading(true);
      try {
        const { messages } = await fetch(`/api/chat?id=${threadId}`,
                               { cache: 'no-store' }).then(r => r.json());
        setMessages(messages);
        setError(null);
      } catch { setError('DB_ERROR'); }
      finally { setLoading(false); }
    })();
  }, [threadId]);

  /* gửi tin nhắn …    (phần còn lại giữ nguyên) */
  /* … */
}
