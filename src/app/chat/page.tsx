/* Trang /chat – render ChatLayout + ChatShell
   (ChatShell là component hiển thị nội dung đoạn chat hiện tại) */

import ChatLayout from "@/components/ChatLayout"
import ChatShell  from "@/components/ChatShell"

/* 👉  Nếu bạn đã có logic Supabase lấy user, giữ nguyên.
      Khi chưa cần, để null cũng OK – MessageInput vẫn gửi userId=null. */
export default async function ChatPage() {
  const userId = null                    // TODO: lấy real userId nếu muốn

  return (
    <ChatLayout userId={userId}>
      <ChatShell userId={userId} />
    </ChatLayout>
  )
}
