/* -------------------------------------------------------------------------- *
 * Middleware: refresh cookie, bảo vệ trang MBTI/Holland/Knowdell + thanh toán
 * -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient }    from '@supabase/auth-helpers-nextjs' // ⬅️ thay @supabase/ssr
import { STATUS }                    from '@/lib/constants'

/*  Chặn mọi request trừ static asset /favicon/_next/...  */
export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.).*)'],
}

export async function middleware (req: NextRequest) {
  /* ---------------------------------------------------- *
   * 1. Khởi tạo Supabase & tự động refresh cookie phiên
   * ---------------------------------------------------- */
  const res       = NextResponse.next()
  const supabase  = createMiddlewareClient({ req, res })

  // Gọi getSession() để Supabase tự refresh access / refresh-token
  const {
    data: { session },
  } = await supabase.auth.getSession()

  /* 2. Nếu CHƯA đăng nhập → redirect /signup?redirectedFrom=... */
  if (!session?.user) {
    const url = req.nextUrl.clone()
    url.pathname = '/signup'
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const user      = session.user
  const pathname  = req.nextUrl.pathname

  /* ---------------------------------------------------- *
   * 3. Xác định xem đường dẫn hiện tại có yêu cầu thanh toán
   * ---------------------------------------------------- */
  let product: 'mbti' | 'holland' | 'knowdell' | null = null
  if      (pathname.startsWith('/mbti'))     product = 'mbti'
  else if (pathname.startsWith('/holland'))  product = 'holland'
  else if (pathname.startsWith('/knowdell')) product = 'knowdell'

  if (product) {
    /* -------------------------------------------------- *
     *   Kiểm tra bảng payments: đã thanh toán hay chưa
     * -------------------------------------------------- */
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('product', product)
      .eq('status', STATUS.PAID)
      .maybeSingle()

    if (error) {
      // Log lỗi nhưng vẫn cho request đi tiếp để không chặn UI
      console.error('Middleware payment lookup error:', error)
      return res
    }

    /* Chưa thanh toán → ép redirect /payment?product=... */
    if (!payment) {
      const payUrl = req.nextUrl.clone()
      payUrl.pathname = '/payment'
      payUrl.searchParams.set('product', product)
      return NextResponse.redirect(payUrl)
    }
  }

  /* Cookie Supabase mới (nếu có) đã được attach vào `res` bởi helper  */
  return res
}
