import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ChatLayout from '@/components/ChatLayout';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type PageProps = {
  /** Các query string, ví dụ /chat?id=abc */
  searchParams?: Record<string, string | string[]>;
};

export default async function ChatPage({ searchParams }: PageProps) {
  /* 1. Xác thực người dùng */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* 2. Lấy danh sách thread (overview) */
  const { data } = await supabase.rpc('v_chat_overview', { _user_id: user.id });
  const threads = Array.isArray(data) ? data : [];

  /* 3. Xác định thread được chọn
        - Ưu tiên ?id=… trên URL
        - Nếu không có, lấy thread đầu tiên (nếu có)
  */
  const initialThreadId =
    typeof searchParams?.id === 'string'
      ? searchParams.id
      : threads[0]?.id ?? null;

  return (
    <ChatLayout
      threads={threads}
      initialThreadId={initialThreadId}
      userId={user.id}
    />
  );
}
