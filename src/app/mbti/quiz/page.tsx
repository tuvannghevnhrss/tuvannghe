import { Suspense } from 'react';
import dynamic      from 'next/dynamic';

export const metadata = { title: 'MBTI Quiz • CareerAI' };

/* dynamic không cần ssr:false → tránh lỗi Next 15 */
const MbtiClient = dynamic(() => import('../MbtiClient'));

export default function MbtiQuizPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
