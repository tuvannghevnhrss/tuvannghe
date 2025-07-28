// -----------------------------------------------------------------------------
// src/app/holland/quiz/page.tsx       (SERVER component – no "use client")
// -----------------------------------------------------------------------------
import { cookies }            from 'next/headers';
import { redirect }           from 'next/navigation';
import { createServerComponentClient }
       from '@supabase/auth-helpers-nextjs';
import { STATUS }             from '@/lib/constants';

import QuizClient             from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function HollandQuizPage() {
  /* 1 ▸ Auth --------------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/holland/quiz');

  /* 2 ▸ Đã trả tiền?  (Holland **hoặc** Knowdell) -------------------------- */
  const { data: payments } = await supabase
    .from('payments')
    .select('product, status')
    .eq('user_id', user.id)
    .eq('status', STATUS.PAID);

  const paid = (payments ?? []).some(p =>
    p.product === 'holland' || p.product === 'knowdell'
  );

  if (!paid) {
    // chưa thanh toán ⇒ quay về trang intro
    redirect('/holland');
  }

  /* 3 ▸ OK – render quiz (client-side) ------------------------------------ */
  return <QuizClient />;
}
