// src/components/ChatLayout.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChat, ChatMessage } from '@/context/chat'
import HistoryList from './HistoryList'        // <-- import mới
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { MBTI_MAP } from '@/lib/mbtiDescriptions'

export default function ChatLayout() {
  const { prependMessage, messages } = useChat()
  const searchParams = useSearchParams()
  const initialMbti = searchParams.get('initial') ?? ''
  const hasPrepended = useRef(false)

  useEffect(() => {
    if (!initialMbti || hasPrepended.current) return
    const desc = MBTI_MAP[initialMbti]
    if (desc) {
      const m: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: '',
        role: 'assistant',
        content: `
${initialMbti} là một trong 16 loại người theo chỉ số Myers-Briggs…

${desc.intro}

Ưu điểm:
${desc.strengths.map((s) => `- ${s}`).join('\n')}

Khuyết điểm:
${desc.flaws.map((f) => `- ${f}`).join('\n')}

Gợi ý nghề nghiệp:
${desc.careers.map((c) => `- ${c}`).join('\n')}

Với tính cách của bạn, bạn có muốn thử phương pháp Holland không?`,
        created_at: new Date().toISOString(),
      }
      prependMessage(m)
      hasPrepended.current = true
    }
  }, [initialMbti, prependMessage])

  return (
    <div className="h-screen flex">
      {/* —— Cột trái: chỉ show tóm tắt */}
      <aside className="w-1/4 border-r bg-gray-50 flex flex-col">
        <header className="px-4 py-2 font-medium text-gray-600">Lịch sử chat</header>
        <div className="flex-1 overflow-y-auto px-4">
          <HistoryList messages={messages} />
        </div>
      </aside>

      {/* —— Cột phải: chat full */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 bg-white text-black">
          <MessageList messages={messages} />
        </div>
        <footer className="border-t px-4 py-3 bg-white">
          <MessageInput />
        </footer>
      </main>
    </div>
  )
}
