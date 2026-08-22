/* -------------------------------------------------------------------------- *
 * Middleware: refresh cookie, bảo vệ trang MBTI/Holland/Knowdell + thanh toán
 * -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { STATUS }                    from '@/lib/constants'
import { isAdminEmail }              from '@/lib/adminAuth'

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.).*)'],
}

export async function middleware(req: NextRequest) {
  const pathname    = req.nextUrl.pathname
  const hasAuthCode = req.nextUrl.searchParams.has('code')

  /* Nếu có ?code= ở trang khác → chuyển về /auth/callback */
  if (hasAuthCode && pathname !== '/auth/callback') {
    const callbackUrl = req.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    callbackUrl.searchParams.set('redirectedFrom', pathname || '/')
    return NextResponse.redirect(callbackUrl)
  }

  /* ---------------------------------------------------- *
   * Khởi tạo Supabase + tự động refresh session cookie
   * ---------------------------------------------------- */
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          /* Cập nhật vào cả request lẫn response để middleware chain nhất quán */
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  /* ---------------------------------------------------- *
   * Public paths — cho qua không cần auth
   * ---------------------------------------------------- */
  const publicPaths = ['/', '/signup', '/auth/callback', '/auth/confirm', '/blog', '/phongtran', '/tuyendung']
  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/blog/')         ||
    pathname.startsWith('/api/auth')      ||
    pathname.startsWith('/api/interview') ||
    pathname.startsWith('/interview')     ||
    (pathname.startsWith('/tuyendung/') && !pathname.startsWith('/tuyendung/admin'))

  if (isPublicPath) return res

  /* ---------------------------------------------------- *
   * Chưa đăng nhập → redirect /signup
   * ---------------------------------------------------- */
  if (!session?.user) {
    const url = req.nextUrl.clone()
    url.pathname = '/signup'
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const user = session.user

  /* ---------------------------------------------------- *
   * Back Office: phải có mặt trong admin_users, hoặc nằm
   * trong ADMIN_EMAILS làm bootstrap (xem lib/admin/getAdminUser.ts)
   * ---------------------------------------------------- */
  if (pathname.startsWith('/admin')) {
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const isBootstrapAdmin = isAdminEmail(user.email)

    if (!adminRow && !isBootstrapAdmin) {
      /* Không lộ sự tồn tại của route cho user không phải admin */
      return new NextResponse('Not Found', { status: 404 })
    }

    return res
  }

  /* ---------------------------------------------------- *
   * Kiểm tra thanh toán theo đường dẫn
   * ---------------------------------------------------- */
  let product: 'mbti' | 'holland' | 'knowdell' | null = null
  if      (pathname.startsWith('/mbti'))     product = 'mbti'
  else if (pathname.startsWith('/holland'))  product = 'holland'
  else if (pathname.startsWith('/knowdell')) product = 'knowdell'

  if (product) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('product', product)
      .eq('status', STATUS.PAID)
      .maybeSingle()

    if (error) {
      console.error('Middleware payment lookup error:', error)
      return res
    }

    if (!payment) {
      const payUrl = req.nextUrl.clone()
      payUrl.pathname = '/payment'
      payUrl.searchParams.set('product', product)
      return NextResponse.redirect(payUrl)
    }
  }

  return res
}
