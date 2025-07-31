'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Menu, MessageCircle, School } from 'lucide-react';

import HistoryList   from '@/components/HistoryList';
import MessageInput  from '@/components/MessageInput';
import type { ThreadMeta } from './types';
import { Button }      from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type Props = { threads: ThreadMeta[]; children: ReactNode };

export default function ChatLayout({ threads, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <section className="grid h-[calc(100vh-48px)] grid-cols-[auto_1fr] bg-background">
      {/* ────────── SIDEBAR ────────── */}
      <aside
        className={clsx(
          'flex flex-col border-r bg-muted transition-all duration-300',
          open ? 'w-60' : 'w-0 overflow-hidden'
        )}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-primary">🎓</span>
            <span className="hidden lg:inline">Hướng nghiệp AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            <Menu size={18} />
          </Button>
        </div>

        {/* Threads */}
        <ScrollArea className="flex-1">
          <h2 className="px-4 pt-2 pb-1 text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
            <MessageCircle size={14} /> Đoạn chat
          </h2>
          {threads.map(t => (
            <Link
              key={t.id}
              href={`/chat/${t.id}`}
              className="block truncate px-4 py-2 text-sm hover:bg-accent"
            >
              {t.title || 'Không tiêu đề'}
            </Link>
          ))}
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Quick links */}
        <nav className="border-t p-2 text-sm">
          <h2 className="mb-1 flex items-center gap-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
            <School size={14} /> Khám phá
          </h2>
          <Link href="/mbti"    className="block rounded px-3 py-2 hover:bg-accent">MBTI</Link>
          <Link href="/holland" className="block rounded px-3 py-2 hover:bg-accent">Holland</Link>
        </nav>
      </aside>

      {/* ────────── CHAT AREA ────────── */}
      <main className="relative flex flex-col">
        {/* messages */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {/* input cố định dưới đáy */}
        <div className="border-t bg-background p-3">
          <MessageInput />
        </div>
      </main>
    </section>
  );
}
