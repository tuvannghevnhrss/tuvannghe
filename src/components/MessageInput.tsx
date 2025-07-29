/* ------------------------------------------------------------------
   MessageInput – ô gửi tin nhắn đơn giản
------------------------------------------------------------------- */
'use client';

import { useState, FormEvent } from 'react';

type Props = {
  onSend   : (text: string) => void;
  disabled?: boolean;
};

export default function MessageInput({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t bg-gray-50 px-4 py-3"
    >
      <input
        className="flex-1 rounded border px-3 py-2 text-sm outline-none disabled:bg-gray-100"
        placeholder="Nhập tin nhắn…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Gửi
      </button>
    </form>
  );
}
