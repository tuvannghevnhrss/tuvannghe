// -----------------------------------------------------------------------------
// src/app/holland/page.tsx   (SERVER component – không “use client”)
// -----------------------------------------------------------------------------
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { STATUS } from '@/lib/constants';

import HollandIntro from './HollandIntro';

export default async function HollandIntroPage() {
  /* 1 ▸ auth -------------------------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/holland');

  /* 2 ▸ đã thanh toán?  (holland **hoặc** knowdell) ----------------------- */
  const { data: paidRows } = await supabase
    .from('payments')
    .select('product')
    .eq('user_id', user.id)
    .eq('status', STATUS.PAID);

  const hasPaid = (paidRows ?? []).some(r =>
    r.product === 'holland' || r.product === 'knowdell',
  );

  /* 3 ▸ đã có kết quả? ---------------------------------------------------- */
  const { data: result } = await supabase
    .from('holland_results')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  const hasResult = !!result?.code;

  /* 4 ▸ render ------------------------------------------------------------ */
  return <HollandIntro hasPaid={hasPaid} hasResult={hasResult} />;
}
