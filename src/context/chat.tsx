'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Database } from '@/types/supabase'

// Kiểu tin nhắn
export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatCtx {
  messages: ChatMessage[]
  prependMessage: (m: ChatMessage) => void
  sendMessage: (content: string) => Promise<void>
}

const ChatContext = createContext<ChatCtx | undefined>(undefined)

export const useChat = () => {
  const c = useContext(ChatContext)
  if (!c) throw new Error('useChat must be used within ChatProvider')
  return c
}

export function ChatProvider({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // 1) Khởi fetch lịch sử
  useEffect(() => {
    // nếu bạn muốn load từ Supabase, gọi ở đây…
    // supabase.from('chat_messages').select('*').eq('user_id', userId)…
  }, [userId])

  // 2) prepend (MBTI intro)
  const prependMessage = (m: ChatMessage) =>
    setMessages((prev) => [m, ...prev])

  // 3) gửi message lên AI
  const sendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((p) => [...p, userMsg])

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    })
    const { reply } = await res.json()
    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    }
    setMessages((p) => [...p, botMsg])
  }

  return (
    <ChatContext.Provider
      value={{ messages, prependMessage, sendMessage }}
    >
      {children}
    </ChatContext.Provider>
  )
}
