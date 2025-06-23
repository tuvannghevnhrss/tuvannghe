'use client'

import { useRouter } from 'next/navigation'
import { questions, useQuiz } from '@/context/quiz'
import Link from 'next/link'

export default function QuestionClient({ qid }: { qid: string }) {
  const { answers, setAnswer } = useQuiz()
  const router = useRouter()

  const idx = questions.findIndex(q => q.id === qid)
  if (idx < 0) return <p className="p-8">Không tìm thấy câu hỏi.</p>

  const q = questions[idx]
  const choose = (c: 'A' | 'B') => {
    setAnswer(q.id, c)
    const next = questions[idx + 1]
    router.push(next ? `/mbti-test/${next.id}` : '/mbti-test/result')
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <p className="mb-8 font-semibold">{q.text}</p>
      <div className="flex gap-4">
        <button
          onClick={() => choose('A')}
          className="flex-1 bg-indigo-600 text-white py-2 rounded"
        >
          {q.optionA}
        </button>
        <button
          onClick={() => choose('B')}
          className="flex-1 bg-indigo-600 text-white py-2 rounded"
        >
          {q.optionB}
        </button>
      </div>
      {idx > 0 && (
        <Link
          href={`/mbti-test/${questions[idx - 1].id}`}
          className="block mt-6 text-sm text-indigo-500"
        >
          ← Quay lại
        </Link>
      )}
    </div>
  )
}
