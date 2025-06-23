// wrap toàn bộ MBTI flow với context
import { QuizProvider } from '@/context/quiz'

export default function MBTITestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <QuizProvider>{children}</QuizProvider>
}
