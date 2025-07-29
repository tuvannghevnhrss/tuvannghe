/* ------------------------------------------------------------------ */
/*  ChatShell – nội dung + input, tự tạo thread đầu tiên               */
/* ------------------------------------------------------------------ */
'use client';

import { useEffect, useState } from 'react';
import MessageList  from './MessageList';
import MessageInput from './MessageInput';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

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

  /* tạo thread đầu tiên nếu chưa có -------------------------------------- */
  useEffect(() => {
    (async () => {
      if (!threadId) {
        try {
          const res  = await fetch('/api/chat', { method: 'POST' });
          const data = await res.json();            // { id }
          onThreadChange(data.id);
        } catch {
          setError('DB_ERROR');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  /* tải tin nhắn mỗi khi đổi thread -------------------------------------- */
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/chat?id=${threadId}`, { cache: 'no-store' });
        const data = await res.json();
        setMessages(data.messages as Msg[]);
        setError(null);
      } catch {
        setError('DB_ERROR');
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId]);

  /* gửi tin nhắn ---------------------------------------------------------- */
  const send = async (text: string) => {
    if (!threadId) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: text }]);

    const res  = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: threadId, content: text }),
    });
    const data = await res.json();

    if (data.error) return;                    // xử lý lỗi nếu muốn
    setMessages((m) => [...m, { id: data.id, role: 'assistant', content: data.content }]);
  };

  /* ---------------------------------------------------------------------- */
  if (error)
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        {error}
      </div>
    );

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center text-gray-500">Đang tải…</p>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <MessageInput onSend={send} disabled={loading || !threadId} />
      </div>
    </>
  );
}
