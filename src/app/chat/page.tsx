import ChatLayout      from '@/components/chat/ChatLayout';
import MessageList     from '@/components/chat/MessageList';
import type { ThreadMeta } from '@/components/chat/types';

/** Server-action lấy toàn bộ thread của user hiện tại. */
async function fetchThreadsForUser(): Promise<ThreadMeta[]> {
  // 👉 Thay thế bằng supabase / DB thực tế của bạn
  return [];
}

export default async function ChatPage() {
  const threads = await fetchThreadsForUser();

  return (
    <ChatLayout threads={threads}>
      {/* Khi chưa chọn thread ⇒ hiện hướng dẫn trống */}
      <div className="text-muted-foreground text-center">
        Chọn một đoạn chat ở thanh bên trái hoặc tạo cuộc trò chuyện mới.
      </div>
    </ChatLayout>
  );
}
