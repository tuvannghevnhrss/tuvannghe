'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { Button } from '@/components/ui/button';

export default function MessageInput() {
  const [value, setValue] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;

    const supabase = supabaseBrowser();
    await supabase.from('messages').insert({ role: 'user', content: text });
    setValue('');
    // Tuỳ bạn xử lý realtime hoặc mutate SWR...
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none"
        placeholder="Nhập tin nhắn…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit">Gửi</Button>
    </form>
  );
}