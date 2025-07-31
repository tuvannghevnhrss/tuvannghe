import type { ChatMessage } from '@/components/HistoryList';
import HistoryList from '@/components/HistoryList';
import MessageInput from '@/components/MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';

export default function ChatLayout({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return (
    <section className="flex h-[calc(100vh-48px)]">
      {/* =========== SIDEBAR =========== */}
      <aside className="w-64 border-r bg-muted/40">
        <HistoryList messages={messages} />
      </aside>

      {/* =========== VÙNG CHAT =========== */}
      <main className="flex flex-col flex-1">
        <ScrollArea className="flex-1 px-6 py-4">
          <MessageList messages={messages} />
        </ScrollArea>

        <div className="border-t bg-white p-3">
          <MessageInput />
        </div>
      </main>
    </section>
  );
}