// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  /* Tạo Supabase client dựa trên cookie request & response */
  const supabase = createMiddlewareClient({ req, res })

  /* Lấy session (nếu có) */
  const {
    data: { session },
  } = await supabase.auth.getSession()

  /* Nếu chưa đăng nhập → chuyển sang /login
     và lưu lại đường dẫn gốc trong query ?redirectedFrom=... */
  if (!session && req.nextUrl.pathname.startsWith('/chat')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  /* Đã có session hoặc không phải /chat → cho đi tiếp  */
  return res
}

/* Áp dụng middleware cho mọi URL bắt đầu /chat */
export const config = {
  matcher: ['/chat/:path*'],
}
