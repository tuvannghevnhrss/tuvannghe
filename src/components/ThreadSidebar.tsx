/* src/components/ThreadSidebar.tsx */
import Link from 'next/link';

export default function ThreadSidebar({
  threads,
  userId,
  initialThreadId,
}: {
  threads: { id: string; title: string }[];
  userId: string;
  initialThreadId: string | null;
}) {
  return (
    <aside className="w-60 shrink-0 border-r bg-white">
      <header className="border-b px-4 py-2 font-semibold">
        Lịch sử chat
      </header>

      <nav className="flex flex-col gap-1 overflow-y-auto p-2">
        {threads.length === 0 && (
          <span className="text-sm text-gray-500">Chưa có cuộc trò chuyện.</span>
        )}

        {threads.map(t => (
          <Link
            key={t.id}
            href={`/chat?threadId=${t.id}`}
            className={`
              truncate rounded px-3 py-2 text-sm
              hover:bg-gray-100
              ${t.id === initialThreadId ? 'bg-gray-100 font-medium' : ''}
            `}
          >
            {t.title || 'Cuộc trò chuyện mới'}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
