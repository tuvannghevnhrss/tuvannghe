// -----------------------------------------------------------------------------
// src/app/holland/quiz/page.tsx       (SERVER component – no "use client")
// -----------------------------------------------------------------------------
import { redirect }           from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STATUS }             from '@/lib/constants';

import QuizClient             from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function HollandQuizPage() {
  /* 1 ▸ Auth --------------------------------------------------------------- */
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signup?redirectedFrom=/holland/quiz');

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
