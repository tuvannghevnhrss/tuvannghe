'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat, ChatMessage } from '@/context/chat';
import HistoryList from './HistoryList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { MBTI_MAP } from '@/lib/mbtiDescriptions';

export default function ChatLayout() {
  const { prependMessage, messages } = useChat();
  const searchParams   = useSearchParams();
  const initialMbti    = searchParams.get('initial') ?? '';
  const hasPrepended   = useRef(false);

  /* tự chèn mô-tả MBTI */
  useEffect(() => {
    if (!initialMbti || hasPrepended.current) return;
    const d = MBTI_MAP[initialMbti];
    if (d) {
      prependMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Kết quả MBTI của bạn là **${initialMbti}**.\n\n${d.intro}`,
      } as ChatMessage);
      hasPrepended.current = true;
    }
  }, [initialMbti, prependMessage]);

  /* ----------- UI ----------- */
  return (
    <div className="h-screen flex">
      {/* sidebar */}
      <aside className="w-1/4 border-r bg-gray-50 flex flex-col">
        <header className="px-4 py-2 font-semibold text-gray-700">
          Lịch sử chat
        </header>
        <div className="flex-1 overflow-y-auto px-4">
          <HistoryList messages={messages} />
        </div>
      </aside>

      {/* main chat */}
      <main className="flex-1 flex flex-col">
        <header className="border-b px-4 py-2 font-semibold text-gray-700">
          Chat
        </header>
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <MessageList messages={messages} />
        </div>
        <footer className="border-t px-4 py-3 bg-white">
          <MessageInput />
        </footer>
      </main>
    </div>
  );
}
