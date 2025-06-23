'use client';
import React from 'react';
import { useChat } from '@/context/chat';

export default function MessageList() {
  const { messages } = useChat();
  return (
    <ul className="space-y-2">
      {messages.map((msg) => (
        <li key={msg.id} className={msg.role === 'assistant' ? 'text-blue-600' : 'text-Black-900'}>
          <span className="font-medium">
            {msg.role === 'assistant' ? 'Trợ lý Seven:' : 'Bạn:'}
          </span>{' '}
          {msg.content}
        </li>
      ))}
    </ul>
  );
}
