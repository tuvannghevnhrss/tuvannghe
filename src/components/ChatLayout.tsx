/* src/components/ChatLayout.tsx */
import ThreadSidebar from './ThreadSidebar';
import MessageList   from './MessageList';
import MessageInput  from './MessageInput';

interface Props {
  threads: { id: string; title: string }[];
  userId:  string;
  initialThreadId: string | null;
}

export default function ChatLayout({ threads, userId, initialThreadId }: Props) {
  return (
    <div className="flex h-full">
      {/* -------- SIDEBAR --------- */}
      <ThreadSidebar
        threads={threads}
        userId={userId}
        initialThreadId={initialThreadId}
      />

      {/* -------- MAIN --------- */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {/* Danh sách tin nhắn cuộn được  */}
        <MessageList
          userId={userId}
          initialThreadId={initialThreadId}
          className="flex-1 overflow-y-auto px-6 py-4"
        />

        {/* Ô nhập – luôn bám đáy  */}
        <MessageInput
          userId={userId}
          initialThreadId={initialThreadId}
          className="sticky bottom-0 border-t bg-white px-6 py-4"
        />
      </div>
    </div>
  );
}
