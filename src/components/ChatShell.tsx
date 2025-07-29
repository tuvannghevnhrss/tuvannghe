/* ------------------------------------------------------------------ */
/*  ChatShell – tạo thread tự động, không còn nút “Chat mới”          */
/* ------------------------------------------------------------------ */
'use client';

import { useState, useEffect } from 'react';
import MessageList  from './MessageList';
import MessageInput from './MessageInput';
import type { Thread } from './ChatLayout';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatShell() {
  /* ---------- state ---------- */
  const [threads, setThreads] = useState<Thread[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending , setPending ] = useState(false);

  /* ---------- helpers ---------- */
  const loadThreads = async () => {
    const res   = await fetch('/api/chat');
    const data  = await res.json();
    setThreads(data.chats as Thread[]);
  };

  const loadMessages = async (id: string) => {
    const res  = await fetch(`/api/chat?id=${id}`, { cache: 'no-store' });
    const data = await res.json();
    setMessages(data.messages as Msg[]);
  };

  /* ---------- on mount ---------- */
  useEffect(() => {
    (async () => {
      await loadThreads();

      // nếu chưa có thread hiện hành → tạo mới
      if (!current) {
        const res  = await fetch('/api/chat', { method: 'POST' });
        const data = await res.json();         // { id }
        setCurrent(data.id);
      }
    })();
  }, []); // chỉ chạy 1 lần

  /* ---------- khi current thay đổi ---------- */
  useEffect(() => {
    if (current) loadMessages(current);
  }, [current]);

  /* ---------- gửi tin ---------- */
  const send = async (text: string) => {
    if (!current) return;

    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    const res  = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: current, content: text }),
    });
    const data = await res.json(); // { id , content }
    setMessages((m) => [
      ...m,
      { id: data.id, role: 'assistant', content: data.content },
    ]);
    setPending(false);
    loadThreads();
  };

  /* ---------- UI ---------- */
  if (!current)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Đang khởi tạo cuộc trò chuyện…
      </div>
    );

  return (
    <>
      {/* Header */}
      <header className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Chat</h2>
      </header>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <MessageList messages={messages} />
        </div>
        <div className="border-t px-4 py-3">
          <MessageInput onSend={send} disabled={pending} />
        </div>
      </div>
    </>
  );
}
