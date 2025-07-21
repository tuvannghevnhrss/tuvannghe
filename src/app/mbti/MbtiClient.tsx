/* src/app/mbti/MbtiClient.tsx
   – Client component hiển thị & xử lý 60 câu MBTI
---------------------------------------------------------------- */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QUESTIONS } from './questions';        // ← lấy đúng named-export
import cx from 'classnames';

/* ---------- hằng số ---------- */
const TOTAL = QUESTIONS.length;                 // 60

/* ---------- tiện ích ---------- */
function nextIndex(index: number) {
  // Khi đã trả lời hết -> -1 để báo “xong”
  return index + 1 < TOTAL ? index + 1 : -1;
}

/* ---------- component ---------- */
export default function MbtiClient() {
  const router       = useRouter();
  const params       = useSearchParams();
  const startParam   = Number(params.get('start') ?? '0');

  // “cursor” là index câu hiện tại; -1 nghĩa là đã xong
  const [cursor, setCursor] = useState<number>(
    Number.isFinite(startParam) && startParam >= 0 && startParam < TOTAL
      ? startParam
      : 0
  );

  // Lưu đáp án (0 | 1) cho 60 câu
  const [answers] = useState<number[]>(Array(TOTAL).fill(-1));

  /* Sau khi xong -> chuyển sang trang thanks  */
  useEffect(() => {
    if (cursor === -1) {
      // Ở đây bạn có thể POST answers lên Supabase trước khi điều hướng
      router.replace('/mbti/thanks');
    }
  }, [cursor, router]);

  /* ---------- render ---------- */
  if (cursor === -1) return null;                       // đang navigate

  const q = QUESTIONS[cursor];                          // { a: string, b: string }

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-16 pt-6 text-center">
      {/* thanh tiến trình */}
      <div className="relative h-2 w-full rounded bg-gray-200">
        <div
          className="absolute inset-0 rounded bg-blue-600 transition-all"
          style={{ width: ((cursor + 1) / TOTAL) * 100 + '%' }}
        />
      </div>

      <p className="text-sm text-gray-600">
        Câu {cursor + 1}/{TOTAL} &nbsp;·&nbsp;
        {Math.round(((cursor + 1) / TOTAL) * 100)}%
      </p>

      {/* 2 phương án */}
      <div className="space-y-4">
        {[q.a, q.b].map((txt, i) => (
          <button
            key={i}
            className={cx(
              'w-full rounded border px-4 py-3 text-lg transition',
              'hover:bg-blue-50 active:scale-[.97]',
              answers[cursor] === i && 'border-blue-600 bg-blue-50'
            )}
            onClick={() => {
              answers[cursor] = i;
              setCursor(nextIndex(cursor));
            }}
          >
            {txt}
          </button>
        ))}
      </div>

      {/* nút quay lại */}
      {cursor > 0 && (
        <button
          className="mt-8 text-sm text-gray-500 underline underline-offset-2 hover:text-black"
          onClick={() => setCursor(cursor - 1)}
        >
          ← Quay lại
        </button>
      )}
    </div>
  );
}
