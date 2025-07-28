/* -------------------------------- ChatLayout.tsx --------------------------- */
/* Server component – dựng khung 2-cột cố định rộng 100%                       */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function ChatLayout(
  { children }: React.PropsWithChildren,
) {
  /* ── kiểm tra đăng nhập ── */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/chat');

  /* ── render khung ── */
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid h-[80vh] grid-cols-1 lg:grid-cols-3 gap-6">
        {children /* ChatShell sẽ được lồng vào đây */}
      </div>
    </div>
  );
}
