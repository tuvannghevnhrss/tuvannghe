/* src/app/profile/focus/page.tsx
   (tuỳ cấu trúc router, chỉ cần là 1 server component) */
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import FocusTab from '@/components/FocusTab'

export const dynamic = 'force-dynamic'

export default async function FocusPage () {
  // 1 ▸ Lấy user
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup?redirectedFrom=/profile?step=focus')

  // 2 ▸ Truy vấn career_goal
  const { data: goal } = await supabase
    .from('career_goal')
    .select(
      'job, goals, activities, start_date, end_date, supporters'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  // 3 ▸ Render FocusTab đã có prop existing
  return <FocusTab existing={goal} />
}
