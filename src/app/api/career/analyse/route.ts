/* ------------------------------------------------------------------------- *
   /api/career/analyse – Phân tích Knowdell + gợi ý nghề + lưu Supabase
 * ------------------------------------------------------------------------- */
import { NextResponse } from 'next/server'

import { analyseKnowdell }                 from '@/lib/career/analyseKnowdell'
import { suggestJobs }                     from '@/lib/career/matchJobs'
import { createSupabaseRouteServerClient } from '@/lib/supabase/server'

// ❗️CHỈ KHAI BÁO 1 LẦN
export const dynamic = 'force-dynamic'  // Edge hay Node tuỳ Vercel
export const runtime  = 'nodejs'        // cần SERVICE_ROLE key cho DB-write

export async function POST() {
  try {
    /* ------------------------------------------------------------------- *
     * 1) Khởi tạo Supabase client
     * ------------------------------------------------------------------- */
    const supabase = await createSupabaseRouteServerClient()

    /* ------------------------------------------------------------------- *
     * 2) Lấy user từ cookie
     * ------------------------------------------------------------------- */
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json({ error: 'AUTH' }, { status: 401 })
    }
    const uid = user.id

    /* ------------------------------------------------------------------- *
     * 3) (GIỮ LOGIC CŨ) Đọc dữ liệu cần thiết cho phân tích
     * ------------------------------------------------------------------- */
    const { data: profile, error: getErr } = await supabase
      .from('career_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()

    if (getErr) {
      console.error(getErr)
      return NextResponse.json({ error: 'DB_GET' }, { status: 500 })
    }

    /* ------------------------------------------------------------------- *
     * 4) Chạy phân tích Knowdell + gợi ý nghề
     *    — analyseKnowdell(profile) và suggestJobs(profile) chỉ nhận 1 tham số;
     *    trước đây gọi kèm (supabase, uid, ...) khiến profile bên trong 2 hàm
     *    này thực chất nhận nhầm object supabase client, không phải dữ liệu
     *    hồ sơ thật — sửa lại đúng chữ ký.
     * ------------------------------------------------------------------- */
    const summaryMD = await analyseKnowdell(profile)
    const jobs      = await suggestJobs(profile)

    /* ------------------------------------------------------------------- *
     * 5) (GIỮ LOGIC CŨ) Lưu kết quả vào DB
     * ------------------------------------------------------------------- */
    const { error: upErr } = await supabase
      .from('career_profiles')
      .update({
        knowdell_summary: summaryMD,
        suggested_jobs  : jobs, // jsonb[]
        updated_at      : new Date().toISOString(),
      })
      .eq('user_id', uid)

    if (upErr) {
      console.error(upErr)
      return NextResponse.json({ error: 'DB_UPDATE' }, { status: 500 })
    }

    /* ------------------------------------------------------------------- *
     * 6) Trả kết quả
     * ------------------------------------------------------------------- */
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('analyse error:', e)
    return NextResponse.json(
      { error: e?.message || 'INTERNAL' },
      { status: 500 }
    )
  }
}
