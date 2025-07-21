import { Suspense } from 'react';
import MbtiClient    from '../MbtiClient';

export const metadata = { title: 'MBTI Quiz • CareerAI' };

export default function MbtiQuizPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
