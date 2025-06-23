import Link from 'next/link'
import { QuizProvider } from '@/context/quiz'

export default function MBTITestIntro() {
  return (
    <QuizProvider>
      <div className="max-w-lg mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Trắc nghiệm MBTI</h1>
        <p className="mb-8">
          Bài test gồm 4 câu hỏi đơn giản. Chọn A hoặc B cho từng câu để xác định
          mã MBTI của bạn.
        </p>
        <Link
          href="/mbti-test/1"
          className="inline-block bg-indigo-600 px-6 py-3 text-white rounded"
        >
          Bắt đầu
        </Link>
      </div>
    </QuizProvider>
  )
}
