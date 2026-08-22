import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url              = new URL(req.url)
  const code             = url.searchParams.get('code')
  const isRecovery       = url.searchParams.get('type') === 'recovery'
  const redirectedFrom   = url.searchParams.get('redirectedFrom') || '/'
  const providerError    = url.searchParams.get('error_description') || url.searchParams.get('error')

  /* Provider (Google/Facebook) hoặc Supabase từ chối request TRƯỚC khi có code
     (vd. app Facebook chưa cấu hình xong, redirect URI sai...) — trước đây bị
     redirect âm thầm về "/" không có thông báo gì, trông như "không có gì xảy ra". */
  if (providerError) {
    console.error('Auth callback provider error:', providerError)
    const errUrl = new URL('/signup', req.url)
    errUrl.searchParams.set('redirectedFrom', redirectedFrom)
    errUrl.searchParams.set('auth_error', providerError)
    return NextResponse.redirect(errUrl)
  }

  /* Link đặt lại mật khẩu → luôn đưa tới trang cập nhật mật khẩu, không phải
     thẳng trang cũ (redirectedFrom), nếu không user bị đăng nhập ngầm mà
     không bao giờ được hỏi mật khẩu mới. */
  const target = isRecovery
    ? `/auth/update-password?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
    : redirectedFrom

  /* Tạo redirect response TRƯỚC — cookie sẽ được gắn thẳng lên đây */
  const redirectUrl = new URL(target, req.url)
  const response    = NextResponse.redirect(redirectUrl)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: ()                   => req.cookies.getAll(),
          setAll: (cookiesToSet)       => {
            /* Gắn cookie SESSION thẳng lên redirect response */
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback exchange failed:', error.message)
      const errUrl = new URL('/signup', req.url)
      errUrl.searchParams.set('redirectedFrom', redirectedFrom)
      errUrl.searchParams.set('auth_error', error.message)
      return NextResponse.redirect(errUrl)
    }
  }

  return response   /* redirect kèm Set-Cookie headers */
}
