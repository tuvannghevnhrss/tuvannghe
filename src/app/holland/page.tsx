// -----------------------------------------------------------------------------
// src/app/holland/page.tsx           (SERVER component – KHÔNG "use client")
// -----------------------------------------------------------------------------
import { cookies }            from 'next/headers';
import { redirect }           from 'next/navigation';
import { createServerComponentClient }
       from '@supabase/auth-helpers-nextjs';
import { STATUS }             from '@/lib/constants';

import HollandIntro           from './HollandIntro';     // component UI

export const dynamic = 'force-dynamic';

export default async function HollandIntroPage() {
  /* 1 ▸ Xác thực ------------------------------------------------------------ */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/holland');

  /* 2 ▸ Đã trả tiền? (nhận **Holland** HOẶC **Knowdell**) ------------------ */
  const { data: payments } = await supabase
    .from('payments')
    .select('product, status')
    .eq('user_id', user.id)
    .eq('status', STATUS.PAID);

  // nếu user đã mua Knowdell-combo thì coi như Holland đã trả phí
  const hasPaid = (payments ?? []).some(p =>
    p.product === 'holland' || p.product === 'knowdell'
  );

  /* 3 ▸ Đã có kết quả Holland? -------------------------------------------- */
  const { data: result } = await supabase
    .from('holland_results')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  const hasResult = !!result?.code;

  /* 4 ▸ Render ------------------------------------------------------------- */
  return <HollandIntro hasPaid={hasPaid} hasResult={hasResult} />;
}
