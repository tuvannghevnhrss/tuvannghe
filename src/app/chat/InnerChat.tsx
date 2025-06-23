'use client'

import { useChat } from '@/context/chat'

export default function InnerChat() {
  const { messages, prependMessage, sendMessage } = useChat()

  return (
    <div className="h-screen flex text-black bg-gray-50">
      {/* Sidebar lịch sử */}
      <aside className="w-72 shrink-0 border-r bg-white overflow-y-auto">
        <div className="p-4 font-bold">Lịch sử chat</div>
        {messages.map((m) => (
          <div
            key={m.id}
            className="px-4 py-2 hover:bg-gray-100 text-sm"
          >
            <div
              className={`${
                m.role === 'user'
                  ? 'text-right text-indigo-600'
                  : 'text-left text-gray-800'
              }`}
            >
              {m.content}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </aside>

      {/* Main chat */}
      <section className="flex-1 flex flex-col">
        <header className="p-4 border-b text-center font-semibold">
          Chat với HRSS
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 whitespace-pre-line
                ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border text-black'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </main>

        <footer className="p-4 border-t flex gap-2 bg-white">
          <MessageInput onSend={sendMessage} />
        </footer>
      </section>
    </div>
  )
}

function MessageInput({
  onSend,
}: {
  onSend: (msg: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }
  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nhập tin nhắn…"
        className="flex-1 border rounded px-3 py-2 outline-none"
      />
      <button
        onClick={submit}
        className="px-5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        disabled={!text.trim()}
      >
        Gửi
      </button>
    </>
  )
}
