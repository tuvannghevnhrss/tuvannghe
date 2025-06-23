// src/app/mbti-test/[qid]/[answer]/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'

export default function SaveAnswerPage() {
  const { qid, answer } = useParams() as { qid: string; answer: string }
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const nextQid = String(Number(qid) + 1)

  useEffect(() => {
    async function save() {
      if (!session) {
        router.replace('/login')
        return
      }
      const { error } = await supabase
        .from('responses')
        .insert({ user_id: session.user.id, question_id: qid, answer })
      if (error) {
        alert('Lỗi lưu — xem console để debug')
      } else {
        router.replace(`/mbti-test/${nextQid}`)
      }
    }
    save()
  }, [session, supabase, qid, answer, nextQid, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Đang lưu kết quả…</p>
    </div>
  )
}
