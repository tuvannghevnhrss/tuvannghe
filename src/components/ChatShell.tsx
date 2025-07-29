'use client';

import { useEffect, useState } from 'react';
import MessageList  from './MessageList';
import MessageInput from './MessageInput';

export type Msg = { id: string; role: 'user' | 'assistant'; content: string };

type Props = {
  threadId: string | null;
  onThreadChange: (id: string) => void;
  onThreadCreate: (id: string, title: string) => void;
  userId: string;
};

export default function ChatShell({
  threadId,
  onThreadChange,
  onThreadCreate,
  userId,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading , setLoading ] = useState(false);
  const [error   , setError   ] = useState<string | null>(null);

  /* ---- tạo thread đầu tiên nếu chưa có ---- */
  useEffect(() => {
    if (threadId) return;
    (async () => {
      try {
        const res = await fetch('/api/chat', { method: 'POST' }).then(r => r.json());
        onThreadCreate(res.id, 'Cuộc trò chuyện mới');
      } catch { setError('DB_ERROR'); }
    })();
  }, [threadId, onThreadCreate]);

  /* ---- nạp tin nhắn khi đổi thread ---- */
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat?id=${threadId}`, { cache: 'no-store' })
                          .then(r => r.json());
        setMessages(res.messages);
        setError(null);
      } catch { setError('DB_ERROR'); }
      finally { setLoading(false); }
    })();
  }, [threadId]);

  /* ---- gửi tin nhắn ---- */
  const handleSend = async (text: string) => {
    if (!threadId || !text.trim()) return;
    const optimistic: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(m => [...m, optimistic]);

    try {
      const res = await fetch('/api/chat', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ threadId, text }),
      }).then(r => r.json());

      setMessages(m => [...m.filter(x => x.id !== optimistic.id), ...res.messages]);
      onThreadChange(threadId);                       // cập nhật sidebar
    } catch { setError('DB_ERROR'); }
  };

  /* ---- UI ---- */
  if (error)   return <p className="p-4 text-red-600">{error}</p>;
  if (loading) return <p className="p-4 text-gray-500">Đang tải…</p>;

  return (
    <>
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
    </>
  );
}
