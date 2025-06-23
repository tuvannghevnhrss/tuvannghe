'use client'

import { useEffect, useState } from 'react'
import { useQuiz } from '@/context/quiz'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useSession } from '@supabase/auth-helpers-react'
import Link from 'next/link'

export default function ResultClient() {
  const { questions, answers } = useQuiz()
  const sb = supabaseBrowser
  const session = useSession()

  // tính MBTI
  const tally: Record<string,number> = {E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0}
  for (const q of questions) {
    const a = answers[q.id]
    if (!a) continue
    const [x,y] = q.dimension.split('')
    tally[a==='A'?x:y]++
  }
  const code = 
    (tally.E>=tally.I?'E':'I')+
    (tally.S>=tally.N?'S':'N')+
    (tally.T>=tally.F?'T':'F')+
    (tally.J>=tally.P?'J':'P')

  // lưu 1 lần
  const [saved, setSaved] = useState<boolean|null>(null)
  useEffect(()=>{
    if (!session?.user || saved!==null) return
    sb
      .from('results')
      .insert({ user_id: session.user.id, mbti_code: code })
      .then(({ error })=> setSaved(!error))
  },[session,code,saved,sb])

  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <h1 className="text-3xl font-bold mb-6">Kết quả MBTI của bạn</h1>
      <p className="text-2xl mb-4">
        Mã MBTI: <span className="text-indigo-600 font-bold">{code}</span>
      </p>
      {saved===null && <p className="text-gray-500 mb-6">Đang lưu kết quả…</p>}
      {saved===true &&  <p className="text-green-600 mb-6">✓ Đã lưu thành công!</p>}
      {saved===false && <p className="text-red-500 mb-6">✗ Lưu thất bại.</p>}
      <Link
        href={`/chat?initial=${code}`}
        className="inline-block bg-indigo-600 px-6 py-2 text-white rounded"
      >
        Đi tới Chatbot
      </Link>
    </div>
  )
}
