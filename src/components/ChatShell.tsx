/* -------------------------------- ChatShell.tsx --------------------------- */
/* Chia 2 khu: sidebar (1/3) + khung chat (2/3)                                */
'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import MessageList from './MessageList';   // file bạn đã có
import MessageInput from './MessageInput'; // file bạn đã có

type ChatItem = { id: string; title: string; last_msg: string; updated: string };
type Msg      = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatShell() {
  /* ---------- state ---------- */
  const [history, setHistory]   = useState<ChatItem[]>([]);
  const [currentId, setCurrent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading,  setLoading]  = useState(false);

  /* ---------- helpers ---------- */
  const fetchHistory = async () => {
    const res = await fetch('/api/chat', { cache: 'no-store' });
    const data = await res.json();
    setHistory(data.chats as ChatItem[]);
  };
  const fetchMessages = async (cid: string) => {
    setLoading(true);
    const res = await fetch(`/api/chat?id=${cid}`, { cache: 'no-store' });
    const data = await res.json();
    setMessages(data.messages as Msg[]);
    setLoading(false);
  };

  /* ---------- first load ---------- */
  useEffect(() => { fetchHistory(); }, []);

  /* ---------- when choose chat ---------- */
  useEffect(() => { if (currentId) fetchMessages(currentId); }, [currentId]);

  /* ---------- send new msg ---------- */
  const handleSend = async (text: string) => {
    if (!currentId) return;
    const userMsg: Msg = { id: Date.now() + '', role: 'user', content: text };
    setMessages(m => [...m, userMsg]);

    const res = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ id: currentId, content: text }),
    });
    const data = await res.json();
    setMessages(m => [...m, { id: data.id, role: 'assistant', content: data.content }]);
    fetchHistory();                 // cập nhật preview + time
  };

  /* ---------- render ---------- */
  return (
    /* grid-cols-3 đã được ChatLayout bọc; cột 1 ẩn khi < lg  */
    <>
      {/* SIDEBAR */}
      <aside className="hidden lg:block overflow-y-auto rounded border px-4 py-3">
        <h3 className="mb-3 font-semibold">Lịch sử chat</h3>

        {history.length === 0 && <p className="text-sm text-gray-500">Chưa có.</p>}
        <ul className="space-y-2">
          {history.map(chat => (
            <li
              key={chat.id}
              className={clsx(
                'cursor-pointer rounded p-2 hover:bg-indigo-50',
                currentId === chat.id && 'bg-indigo-100',
              )}
              onClick={() => setCurrent(chat.id)}
            >
              <p className="font-medium line-clamp-1">
                {chat.title || 'Chưa đặt tên'}
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">
                {chat.last_msg.slice(0, 40)}
                {chat.last_msg.length > 40 && '…'}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {/* CHAT BOX */}
      <section className="col-span-2 flex flex-col rounded border">
        {currentId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center text-gray-500">Đang tải…</p>
              ) : (
                <MessageList messages={messages} />
              )}
            </div>
            <MessageInput onSend={handleSend} disabled={loading}/>
          </>
        ) : (
          <div className="m-auto text-center space-y-2">
            <p className="text-gray-500">Chọn một cuộc trò chuyện ở cột bên trái<br/>
              hoặc nhấn “Chat mới” để bắt đầu.</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/chat', { method: 'POST' });
                const data = await res.json();
                setCurrent(data.id);
                fetchHistory();
              }}
              className="rounded bg-indigo-600 px-5 py-2 text-white"
            >
              Chat mới
            </button>
          </div>
        )}
      </section>
    </>
  );
}
