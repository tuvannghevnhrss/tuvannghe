'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat, ChatMessage } from '@/context/chat';
import HistoryList from './HistoryList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { MBTI_MAP } from '@/lib/mbtiDescriptions';

/** Bố cục 2 cột: sidebar (lịch sử) + main (chat) */
export default function ChatLayout() {
  const { messages, prependMessage } = useChat();
  const params         = useSearchParams();
  const initialMbti    = params.get('initial') ?? '';
  const hasPrepended   = useRef(false);

  /* Nếu có mã MBTI ở query -> tự chèn lời mở đầu */
  useEffect(() => {
    if (!initialMbti || hasPrepended.current) return;
    const d = MBTI_MAP[initialMbti as keyof typeof MBTI_MAP];
    if (d) {
      prependMessage({
        id      : crypto.randomUUID(),
        role    : 'assistant',
        content : `Kết quả MBTI của bạn là **${initialMbti}**.\n\n${d.intro}`,
      } as ChatMessage);
      hasPrepended.current = true;
    }
  }, [initialMbti, prependMessage]);

  /* ---------------- View ---------------- */
  return (
    <div className="h-[calc(100dvh-4rem)] flex">
      {/* ───── Sidebar (lịch sử) ───── */}
      <aside className="w-72 shrink-0 border-r bg-gray-50 flex flex-col">
        <header className="px-4 py-2 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
          Lịch sử chat
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <HistoryList messages={messages} />
        </div>
      </aside>

      {/* ───── Main chat window ───── */}
      <main className="flex-1 flex flex-col">
        <header className="border-b px-4 py-2 font-semibold text-gray-700 sticky top-0 bg-white z-10">
          Chat
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-4">
          <MessageList messages={messages} />
        </div>

        <footer className="border-t bg-white px-4 py-3 sticky bottom-0">
          <MessageInput />
        </footer>
      </main>
    </div>
  );
}
