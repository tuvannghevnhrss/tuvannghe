'use client';
import { ChatMessage } from '@/context/chat';

interface Props {
  messages: ChatMessage[];
}

/* gom block user→assistant, hiển thị 1 dòng + ngày yyyy-mm-dd */
export default function HistoryList({ messages }: Props) {
  if (!messages.length)
    return (
      <p className="text-sm italic text-gray-500">Chưa có hội thoại.</p>
    );

  const threads: { date: string; preview: string }[] = [];

  for (let i = 0; i < messages.length; i += 2) {
    const user = messages[i];
    const iso = (user.created_at ?? new Date().toISOString()).slice(0, 10); // yyyy-mm-dd
    threads.push({ date: iso, preview: user.content.slice(0, 40) });
  }

  return (
    <ul className="space-y-2">
      {threads.map((t, idx) => (
        <li
          key={idx}
          className="border rounded px-3 py-2 hover:bg-gray-100 text-sm leading-snug cursor-pointer"
        >
          <div className="font-medium text-gray-600">{t.date}</div>
          <div className="truncate">Bạn: {t.preview}</div>
        </li>
      ))}
    </ul>
  );
}
