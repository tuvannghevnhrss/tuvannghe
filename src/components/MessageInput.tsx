'use client';
import { useState } from 'react';

export default function MessageInput({ onSend }: { onSend: (txt: string)=>void }) {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form
      className="w-full px-6 py-4 bg-transparent sticky bottom-0"
      onSubmit={e => { e.preventDefault(); submit(); }}
    >
      <div className="flex gap-2 max-w-3xl mx-auto">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Nhập tin nhắn…"
          className="flex-1 rounded-lg border px-4 py-3 shadow-sm focus:outline-none"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg"
        >
          Gửi
        </button>
      </div>
    </form>
  );
}
