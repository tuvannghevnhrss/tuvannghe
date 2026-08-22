import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Xác thực link email bằng token_hash (OTP), KHÔNG dùng PKCE code exchange.
 * Lý do: link "quên mật khẩu"/"xác nhận đăng ký" thường được mở ở trình duyệt
 * hoặc thiết bị khác với nơi user bắt đầu thao tác (vd. yêu cầu trên máy tính,
 * mở email trên điện thoại) — PKCE code_verifier chỉ tồn tại ở đúng trình
 * duyệt gốc nên sẽ báo lỗi "code verifier should be non-empty". Xác thực bằng
 * token_hash không phụ thuộc trình duyệt nào cả.
 *
 * Cần trỏ link trong Supabase Email Template (Reset Password / Confirm signup)
 * về endpoint này: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&redirectedFrom=...
 */
export async function GET(req: NextRequest) {
  const url            = new URL(req.url)
  const token_hash     = url.searchParams.get('token_hash')
  const type           = url.searchParams.get('type') as EmailOtpType | null
  const redirectedFrom = url.searchParams.get('redirectedFrom') || '/'

  const target = type === 'recovery'
    ? `/auth/update-password?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
    : redirectedFrom

  const redirectUrl = new URL(target, req.url)
  const response     = NextResponse.redirect(redirectUrl)

  if (!token_hash || !type) {
    const errUrl = new URL('/signup', req.url)
    errUrl.searchParams.set('auth_error', 'Liên kết không hợp lệ hoặc đã hết hạn.')
    return NextResponse.redirect(errUrl)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    console.error('Auth confirm verifyOtp failed:', error.message)
    const errUrl = new URL('/signup', req.url)
    errUrl.searchParams.set('redirectedFrom', redirectedFrom)
    errUrl.searchParams.set('auth_error', error.message)
    return NextResponse.redirect(errUrl)
  }

  return response
}
