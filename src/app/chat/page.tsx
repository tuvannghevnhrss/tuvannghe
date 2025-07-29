/* --------------------------------------------------------------------------
   /chat – SERVER component
   -------------------------------------------------------------------------- */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ChatLayout from '@/components/ChatLayout';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function ChatPage({ searchParams }: PageProps) {
  /* 1. Auth ------------------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* 2. Threads overview (RPC) ------------------------------------ */
  const { data: threadsData } = await supabase.rpc('v_chat_overview', {
    _user_id: user.id,
  });
  const threads = Array.isArray(threadsData) ? threadsData : [];

  /* 3. Thread được chọn ------------------------------------------ */
  const initialThreadId =
    typeof searchParams?.id === 'string'
      ? searchParams.id
      : threads[0]?.id ?? null;

  /* 4. Render ----------------------------------------------------- */
  return (
    <ChatLayout
      threads={threads}
      initialThreadId={initialThreadId}
      userId={user.id}
    />
  );
}

/*  🔥  KHÔNG CÒN BẤT CỨ CODE NÀO BÊN DƯỚI –   
    xoá hẳn các truy vấn messages + filter cũ */
