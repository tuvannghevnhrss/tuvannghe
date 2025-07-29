'use client'

import { useState } from 'react'
import { useChat }  from '@/context/chat'

export default function MessageInput() {
  const { threadId, refresh } = useChat()     // giả sử hook đã có
  const [value, setValue] = useState('')

  async function send() {
    const res = await fetch('/api/chat', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({                // ✨ ĐỔI message ➜ content
        content  : value.trim(),
        thread_id: threadId || undefined
      })
    })

    if (res.ok) refresh(await res.json())      // lấy messages mới
  }

  return (
    <form onSubmit={e=>{e.preventDefault(); if(value.trim()) send(); setValue('')}} 
          className="flex gap-2 border-t p-3 bg-gray-50">
      <input
        className="flex-1 rounded bg-white px-4 py-2 text-sm outline-none"
        placeholder="Nhập tin nhắn…"
        value={value}
        onChange={e=>setValue(e.target.value)}
      />
      <button className="bg-indigo-600 text-white px-4 py-2 rounded">Gửi</button>
    </form>
  )
}
