/* ------------------------------------------------------------------ */
/*  ChatShell – client component thực thi logic chat                  */
/* ------------------------------------------------------------------ */
'use client';

import { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Thread } from './ChatLayout';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatShell() {
  /* ---------- state ---------- */
  const [threads, setThreads] = useState<Thread[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);

  /* ---------- fetch helpers ---------- */
  const loadThreads = async () => {
    const res = await fetch('/api/chat');
    const data = await res.json();
    setThreads(data.chats as Thread[]);
  };
  const loadMessages = async (id: string) => {
    const res = await fetch(`/api/chat?id=${id}`, { cache: 'no-store' });
    const data = await res.json();
    setMessages(data.messages as Msg[]);
  };

  /* ---------- initial ---------- */
  useEffect(() => {
    loadThreads();
  }, []);

  /* ---------- when current changes ---------- */
  useEffect(() => {
    if (current) loadMessages(current);
  }, [current]);

  /* ---------- send ---------- */
  const send = async (text: string) => {
    if (!current) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current, content: text }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { id: data.id, role: 'assistant', content: data.content }]);
    setPending(false);
    loadThreads();
  };

  /* ---------- UI ---------- */
  return (
    <>
      {/* Header (ẩn trên mobile – hiển thị trên mọi màn) */}
      <header className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Chat</h2>
      </header>

      {/* Nội dung chat */}
      {current ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <MessageList messages={messages} />
          </div>
          <div className="border-t px-4 py-3">
            <MessageInput onSend={send} disabled={pending} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 text-center">
            <p className="text-gray-500">
              Chọn 1 cuộc trò chuyện ở cột bên trái<br />
              hoặc nhấn “Chat mới” để bắt đầu.
            </p>
            <button
              onClick={async () => {
                const res = await fetch('/api/chat', { method: 'POST' });
                const data = await res.json();
                setCurrent(data.id);
                loadThreads();
              }}
              className="rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
            >
              Chat mới
            </button>
          </div>
        </div>
      )}
    </>
  );
}
