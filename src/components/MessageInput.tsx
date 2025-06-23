'use client'

import { useState } from 'react'
import { useChat } from '@/context/chat'

export default function MessageInput() {
  const { sendMessage } = useChat()
  const [value, setValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    await sendMessage(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nhập tin nhắn…"
        className="flex-1 bg-white border px-4 py-2 rounded text-black placeholder-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
      >
        Gửi
      </button>
    </form>
  )
}
