// src/app/chat/page.tsx
import ChatLayout       from '@/components/ChatLayout';
import type { ThreadMeta } from '@/components/chat/types'; // GIỮ đường dẫn này nếu folder chat/ chứa types

/** 🚀 Lấy danh sách thread của user – thay thế bằng Supabase thực tế */
async function fetchThreadsForUser(): Promise<ThreadMeta[]> {
  return [];          // TODO: gọi Supabase
}

export default async function ChatPage() {
  const threads = await fetchThreadsForUser();

  return (
    <ChatLayout threads={threads}>
      {/* Màn hình trống khi chưa chọn thread */}
      <div className="text-center text-muted-foreground">
        
      </div>
    </ChatLayout>
  );
}
