import { Suspense } from "react";
import ChatClient from "@/components/ChatClient";

export const dynamic = "force-dynamic"; // trang chạy hoàn toàn ở runtime

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải khung chat…</p>}>
      <ChatClient />
    </Suspense>
  );
}
