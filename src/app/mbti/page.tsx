// ⬅️ KHÔNG “use client”
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { STATUS } from '@/lib/constants';
import MbtiIntro from './MbtiIntro';

export default async function MbtiPage() {
  const supabase = createServerComponentClient({ cookies });

  /* 1. Lấy user – MBTI miễn phí nên không check payment */
  const { data: { user } } = await supabase.auth.getUser();

  /* 2. Kiểm tra đã làm & đã có kết quả */
  let hasResult = false;
  if (user) {
    const { data: r } = await supabase
      .from('mbti_results')
      .select('id')
      .eq('user_id', user.id)
      .single();
    hasResult = !!r;
  }

  /* 3. Render Intro */
  return <MbtiIntro hasResult={hasResult} />;
}
