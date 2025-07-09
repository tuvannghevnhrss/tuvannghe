// src/components/MessageList.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { ChatMessage, useChat } from '@/context/chat'

/**
 * Hiển thị luồng hội thoại.
 * - Tin nhắn của “Trợ lý Seven” bám trái (màu xám nhạt)
 * - Tin nhắn của người dùng bám phải (màu xanh indigo)
 * - Tự động cuộn xuống cuối mỗi lần có tin mới
 */
export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  /* luôn cuộn xuống cuối danh sách khi có tin nhắn mới */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <ul className="space-y-3 max-w-3xl mx-auto">
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant'
        return (
          <li
            key={msg.id}
            className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`whitespace-pre-wrap rounded-lg px-4 py-2 leading-relaxed shadow
                ${isAssistant
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-indigo-600 text-white'
                }`}
              style={{ maxWidth: '85%' }}
            >
              <span className="font-medium">
                {isAssistant ? 'Trợ lý Seven:' : 'Bạn:'}
              </span>{' '}
              {msg.content}
            </div>
          </li>
        )
      })}

      {/* phần tử “neo” để auto-scroll */}
      <div ref={endRef} />
    </ul>
  )
}
