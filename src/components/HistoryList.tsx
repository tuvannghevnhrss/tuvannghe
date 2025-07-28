'use client';

import { ChatMessage } from '@/context/chat';

/**
 * Danh sách lịch sử chat (sidebar).
 *  – Chỉ hiển thị tin nhắn của người dùng (role === 'user')
 *  – Mỗi item rút gọn còn ~40 ký tự & hiển thị thời gian HH:mm
 *  – Tin mới nhất nằm trên cùng
 */
export default function HistoryList({ messages }: { messages: ChatMessage[] }) {
  // Lọc & đảo ngược để mới nhất trước
  const userMsgs = messages
    .filter((m) => m.role === 'user')
    .slice()                       // clone
    .reverse();

  if (userMsgs.length === 0) {
    return <p className="text-gray-500 text-sm mt-2">Chưa có hội thoại.</p>;
  }

  return (
    <ul className="space-y-3">
      {userMsgs.map((m) => {
        const preview = m.content.length > 40
          ? m.content.slice(0, 37) + '…'
          : m.content;

        const t = new Date(m.created_at ?? Date.now()); // fallback now

        return (
          <li key={m.id} className="text-sm">
            <div className="font-medium text-gray-900 line-clamp-2">
              {preview}
            </div>
            <time className="text-xs text-gray-500">
              {t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
