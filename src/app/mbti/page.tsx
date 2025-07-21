// src/app/mbti/page.tsx
import { Suspense } from 'react';
import MbtiIntro     from './MbtiIntro';

export const metadata = { title: 'MBTI • CareerAI' };

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiIntro />
    </Suspense>
  );
}
