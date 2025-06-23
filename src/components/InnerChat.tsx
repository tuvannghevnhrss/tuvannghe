'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

// **Thêm dòng này**
import { useChat } from '@/context/chat'

import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function InnerChat() {
  const { messages, prependMessage } = useChat()
  const searchParams = useSearchParams()
  const initialMbti = searchParams.get('initial') ?? ''
  const hasPrepended = useRef(false)

  useEffect(() => {
    if (!initialMbti || hasPrepended.current) return
    prependMessage({
      id: crypto.randomUUID(),
      user_id: '',            // hoặc lấy từ session nếu cần
      role: 'assistant',
      content: `Kết quả MBTI của bạn là ${initialMbti}:
      
${MBTI_MAP[initialMbti].intro}

Ưu điểm:
${MBTI_MAP[initialMbti].strengths.map((s) => `- ${s}`).join('\n')}

Khuyết điểm:
${MBTI_MAP[initialMbti].flaws.map((f) => `- ${f}`).join('\n')}

Gợi ý nghề nghiệp:
${MBTI_MAP[initialMbti].careers.map((c) => `- ${c}`).join('\n')}

Với tính cách của bạn, bạn có muốn tìm hiểu thêm về phương pháp Holland không?`,
      created_at: new Date().toISOString(),
    })
    hasPrepended.current = true
  }, [initialMbti, prependMessage])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  )
}
