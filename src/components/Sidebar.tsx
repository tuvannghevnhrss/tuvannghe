'use client';

import clsx from 'clsx';

export default function Sidebar({
  grouped,
  activeId,
  onSelect,
}: {
  grouped: Record<string, { id: string; messages: { content: string }[] }[]>;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-r overflow-y-auto">
      {Object.entries(grouped).map(([date, list]) => (
        <div key={date}>
          <p className="px-3 py-2 text-xs font-semibold text-gray-500">
            {date}
          </p>

          {list.map((th) => {
            const preview = th.messages[0]?.content.slice(0, 30) ?? '…';
            return (
              <button
                key={th.id}
                onClick={() => onSelect(th.id)}
                className={clsx(
                  'block w-full truncate px-3 py-2 text-left hover:bg-gray-50',
                  activeId === th.id && 'bg-gray-100 font-medium',
                )}
              >
                {preview}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
