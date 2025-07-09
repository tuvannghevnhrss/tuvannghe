'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/* ─── Kiểu dữ liệu ─────────────────────────── */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
};

interface ChatCtx {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  prependMessage: (m: ChatMessage) => void;
}

const ChatContext = createContext<ChatCtx | null>(null);
export const useChat = () => useContext(ChatContext)!;

/* ─── helper localStorage ───────────────────── */
const STORAGE_KEY = 'chatMessages';
const loadLocal = (): ChatMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

/* ─── Provider ──────────────────────────────── */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  /* 1. cùng server: khởi tạo []  */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /* 2. chỉ client: nạp localStorage sau khi hydrate */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = loadLocal();
      if (stored.length) setMessages(stored);
    }
  }, []);

  /* 3. lưu mỗi khi messages thay đổi  */
  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  /* 4. gửi và stream (giữ nguyên tăng tốc) */
  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      let assistant = '';
      const id = crypto.randomUUID();
      let lastFlush = Date.now();

      const flush = () =>
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== id),
          {
            id,
            role: 'assistant',
            content: assistant,
            created_at: new Date().toISOString(),
          },
        ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value);
        if (Date.now() - lastFlush > 60) {
          flush();
          lastFlush = Date.now();
        }
      }
      flush(); // đẩy phần còn lại
    },
    [messages],
  );

  /* 5. chèn tin nhắn thủ công */
  const prependMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => [m, ...prev]);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, prependMessage }}>
      {children}
    </ChatContext.Provider>
  );
}
