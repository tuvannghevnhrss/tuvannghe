"use client";                       // ← QUAN TRỌNG: đánh dấu Client Component

import { Suspense } from "react";
import ChatShell from "@/components/ChatShell";

/**
 * Đặt dynamic để Next bỏ qua bước “Collecting page data” lúc build,
 * tránh phụ thuộc SendGrid hoặc hook client.
 */
export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    /* Bọc Client Component trong <Suspense> để Next hài lòng */
    <Suspense fallback={<p className="p-6">Đang tải khung chat…</p>}>
      <ChatShell />
    </Suspense>
  );
}
