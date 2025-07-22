/* Holland Intro – SERVER component (không “use client”) */
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { STATUS } from '@/lib/constants';

import HollandIntro from './HollandIntro';

export default async function HollandIntroPage() {
  /* 1. Auth --------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/holland');

  /* 2. Đã thanh toán? – payments ----------------------------------- */
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('user_id', user.id)
    .eq('product', 'holland')
    .eq('status', STATUS.PAID)
    .maybeSingle();

  const hasPaid = !!payment;

  /* 3. Đã có kết quả? – holland_results ---------------------------- */
  const { data: result } = await supabase
    .from('holland_results')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  const hasResult = !!result?.code;

  /* 4. Render ------------------------------------------------------- */
  return <HollandIntro hasPaid={hasPaid} hasResult={hasResult} />;
}
