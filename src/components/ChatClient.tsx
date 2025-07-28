/* -------------------------------- ChatClient.tsx -------------------------- */
/* Đơn giản chỉ wrap ChatShell trong ErrorBoundary + Suspense                */
'use client';

import { Suspense } from 'react';
import ChatShell from './ChatShell';

export default function ChatClient() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải khung chat…</p>}>
      <ChatShell />
    </Suspense>
  );
}
