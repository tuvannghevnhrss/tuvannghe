/* ------------------------------------------------------------------
  ChatLayout.tsx – main shell for Chat page
  Assumptions:
  • shadcn/ui & lucide-react already installed (Button, ScrollArea…)
  • next/link + next/navigation for routing
  • All data fetching is passed in as props – this shell is presentational
-------------------------------------------------------------------*/
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ScrollArea,
  ScrollBar,
} from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Menu, MessageCircle, School, Bookmark } from 'lucide-react';
import clsx from 'clsx';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface ThreadMeta {
  id: string;
  title: string;
  createdAt: string; // ISO string – will be grouped by date outside of layout
}

interface ChatLayoutProps {
  threads: ThreadMeta[];
  children: React.ReactNode; // <MessageList> injected by page.tsx
}

// ------------------------------------------------------------------
// Helper component: SidebarHeading
// ------------------------------------------------------------------
function SidebarHeading({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// Helper component: ThreadItem
// ------------------------------------------------------------------
function ThreadItem({ meta, active }: { meta: ThreadMeta; active: boolean }) {
  const pathname = usePathname();
  return (
    <Link
      href={`/chat/${meta.id}`}
      className={clsx(
        'block truncate px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground',
        active && 'bg-accent text-foreground'
      )}
      title={meta.title}
    >
      {meta.title || 'Untitled'}
    </Link>
  );
}

// ------------------------------------------------------------------
// ChatLayout component
// ------------------------------------------------------------------
export default function ChatLayout({ threads, children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <section className="grid h-[calc(100vh-48px)] grid-cols-[auto_1fr] bg-background">
      {/* ----------------------------------------------------------------
           Sidebar – collapsible on mobile
      -----------------------------------------------------------------*/}
      <aside
        className={clsx(
          'flex flex-col border-r bg-muted transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
        )}
      >
        {/* TOP controls (logo + burger) */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-primary">🎓</span>
            <span className="hidden lg:inline">Hướng nghiệp AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={18} />
          </Button>
        </div>

        {/* THREAD LIST */}
        <ScrollArea className="flex-1">
          <SidebarHeading icon={MessageCircle} label="Đoạn chat" />
          {threads.map((t) => (
            <ThreadItem key={t.id} meta={t} active={pathname.includes(t.id)} />
          ))}
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* QUICK LINKS */}
        <nav className="border-t p-2 text-sm">
          <SidebarHeading icon={School} label="Khám phá" />
          <Link
            href="/mbti"
            className="block rounded px-3 py-2 hover:bg-accent hover:text-foreground"
          >
            MBTI
          </Link>
          <Link
            href="/holland"
            className="block rounded px-3 py-2 hover:bg-accent hover:text-foreground"
          >
            Holland
          </Link>
        </nav>
      </aside>

      {/* ----------------------------------------------------------------
           Main chat area
      -----------------------------------------------------------------*/}
      <main className="relative flex flex-col overflow-hidden">
        {/* Chat messages – provided by page.tsx */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">{children}</div>

        {/* Message input docked bottom */}
        <div className="absolute bottom-0 inset-x-0 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          {/* MessageInput will live here via children or portal */}
        </div>
      </main>
    </section>
  );
}
