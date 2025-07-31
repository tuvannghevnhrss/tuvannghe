'use client';
import { ChatMessage } from '@/components/HistoryList';
import clsx from 'classnames';

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={clsx('rounded-lg px-4 py-2 max-w-[80%]', {
            'ml-auto bg-primary text-white': m.role === 'user',
            'bg-gray-100 text-gray-900': m.role === 'assistant',
          })}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}