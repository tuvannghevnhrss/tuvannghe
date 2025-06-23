// src/app/mbti-test/history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'

interface Result {
  id: string
  user_id: string
  mbti_code: string
  created_at: string
}

export default function HistoryPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return

    setLoading(true)
    supabase
      .from<Result>('results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setResult(data)
      })
      .finally(() => setLoading(false))
  }, [session, supabase])

  if (!session) {
    return (
      <p className="p-8 text-center">
        Bạn phải <Link href="/login" className="text-indigo-600">đăng nhập</Link> mới xem được kết quả.
      </p>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12 text-center text-black">
      <h1 className="text-2xl font-bold mb-6">Lịch sử MBTI của bạn</h1>

      {loading && <p>Đang tải…</p>}
      {error && <p className="text-red-500">Lỗi: {error}</p>}

      {!loading && !error && result && (
        <div className="space-y-4">
          <p>
            <span className="font-semibold">Mã MBTI:</span>{' '}
            <span className="text-indigo-600">{result.mbti_code}</span>
          </p>
          <p className="text-sm text-gray-600">
            Ngày làm: {new Date(result.created_at).toLocaleString()}
          </p>
        </div>
      )}

      {!loading && !error && !result && (
        <p>Chưa có kết quả nào.</p>
      )}

      <div className="mt-8">
        <Link
          href="/mbti-test"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded"
        >
          Làm lại quiz
        </Link>
      </div>
    </div>
  )
}
