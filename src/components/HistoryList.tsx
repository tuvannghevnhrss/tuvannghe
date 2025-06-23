// src/components/HistoryList.tsx
'use client'

import { ChatMessage } from '@/context/chat'
import React from 'react'

interface HistoryListProps {
  messages: ChatMessage[]
}

export default function HistoryList({ messages }: HistoryListProps) {
  return (
    <ul className="space-y-2">
      {messages.map((msg) => {
        // Hiệu chỉnh tiền tố
        const prefix = msg.role === 'assistant' ? 'HRSS:' : 'Bạn:'
        // Chỉ lấy dòng đầu tiên, bỏ xuống dòng
        const summary = msg.content.split('\n')[0]
        return (
          <li key={msg.id} className="text-sm text-gray-700 truncate">
            <span className="font-semibold mr-1">{prefix}</span>
            {summary}
          </li>
        )
      })}
    </ul>
  )
}
