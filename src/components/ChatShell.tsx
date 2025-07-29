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

  /* 1 ▸ tạo thread đầu tiên (nếu cần) */
  useEffect(() => {
    if (threadId) return;
    (async () => {
      try {
        const { id } = await fetch('/api/chat', { method: 'POST' }).then(r => r.json());
        onThreadChange(id);
      } catch { setError('DB_ERROR'); }
    })();
  }, [threadId, onThreadChange]);

  /* 2 ▸ nạp tin nhắn khi đổi thread     */
  useEffect(() => {
    if (!threadId) return;

    (async () => {
      setLoading(true);
      try {
        const { messages } = await fetch(`/api/chat?id=${threadId}`, { cache: 'no-store' })
          .then(r => r.json());
        setMessages(messages);
        setError(null);
      } catch { setError('DB_ERROR'); }
      finally { setLoading(false); }
    })();
  }, [threadId]);

  /* 3 ▸ gửi */
  const send = async (text: string) => {
    if (!threadId) return;
    setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', content: text }]);

    const res = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: threadId, content: text }),
    }).then(r => r.json());

    if (res.error) { setError(res.error); return; }
    setMessages(m => [...m, { id: res.id, role: 'assistant', content: res.content }]);
  };

  if (error)
    return <p className="flex-1 flex items-center justify-center text-red-600">{error}</p>;

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <p className="text-center text-gray-500">Đang tải…</p>
                  : <MessageList messages={messages} />}
      </div>

      <div className="border-t px-4 py-3">
        <MessageInput onSend={send} disabled={loading || !threadId} />
      </div>
    </>
  );
}
