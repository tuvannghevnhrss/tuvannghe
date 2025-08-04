/* ---------------------------------------------------------------
   /profile?step=focus – server component
   Nạp dữ liệu từ bảng career_goal rồi render FocusTab
---------------------------------------------------------------- */
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import FocusTab from '@/components/FocusTab'

export const dynamic = 'force-dynamic'

export default async function FocusPage () {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?redirectedFrom=/profile?step=focus')
  }

  const { data: goal } = await supabase
    .from('career_goal')
    .select(`
      job, goals, activities,
      start_date, end_date, supporters
    `)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()    // an toàn: null nếu chưa có

  return <FocusTab existing={goal} />
}
