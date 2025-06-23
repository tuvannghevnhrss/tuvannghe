// src/app/chat/layout.tsx
'use client'

import { ReactNode } from 'react'
import { ChatProvider } from '@/context/chat'
import { useSearchParams } from 'next/navigation'

export default function ChatRouteLayout({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const initialMbti = searchParams.get('initial') ?? ''
  // Dùng 1 UUID tạm, hoặc lấy từ session user nếu có auth
  const userId = crypto.randomUUID()

  return (
    <ChatProvider userId={userId}>
      {children}
    </ChatProvider>
  )
}
