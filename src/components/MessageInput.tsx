/* src/components/MessageInput.tsx */
import { useState } from 'react';

export default function MessageInput({
  userId,
  initialThreadId,
  className = '',
}: {
  userId: string;
  initialThreadId: string | null;
  className?: string;
}) {
  const [text, setText] = useState('');

  async function handleSend() {
    if (!text.trim()) return;
    // POST /api/chat …
    setText('');
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSend();
      }}
      className={`flex gap-2 ${className}`}
    >
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Nhập tin nhắn…"
        className="flex-1 rounded border px-4 py-2 outline-none"
      />
      <button
        type="submit"
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Gửi
      </button>
    </form>
  );
}
