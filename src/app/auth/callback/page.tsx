// src/app/auth/callback/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

export default function Callback() {
  const router = useRouter()
  const search = useSearchParams()
  useEffect(() => {
    // Supabase đã tự lưu session cookie, chỉ cần chuyển trang
    const redirectTo = search.get('redirectedFrom') || '/chat'
    router.replace(redirectTo)
  }, [router, search])
  return <p className="p-8">Đang đăng nhập…</p>
}
