'use client';
import { ChatProvider } from '@/context/chat';
import ChatLayout from '@/components/ChatLayout';

export default function ChatShell() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
