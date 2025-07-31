'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function MessageInput({
  userId,
  threadId,
  className = '',
}: {
  userId: string;
  threadId: string | null;
  className?: string;
}) {
  const [text, setText] = useState('');

  async function handleSend() {
    if (!text.trim() || !threadId) return;

    // INSERT vào chat_messages
    await supabaseBrowser.from('chat_messages').insert({
      thread_id: threadId,
      user_id: userId,
      role: 'user',
      content: text.trim(),
    });

    setText('');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
      className={className}
    >
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn…"
          className="flex-1 rounded border px-4 py-2 outline-none"
        />

        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          disabled={!threadId}
        >
          Gửi
        </button>
      </div>
    </form>
  );
}
