/*  MBTI Client – toàn bộ UI & logic làm bài MBTI
    • /mbti              : hiển thị Intro
    • /mbti/quiz         : làm bài trực tiếp
---------------------------------------------------------------- */
'use client';

import { useState, useEffect, Suspense }   from 'react';
import {
  useRouter,
  useSearchParams,
  usePathname,
}                                          from 'next/navigation';

import MbtiIntro            from './MbtiIntro';
import { QUESTIONS }         from './questions';
import type { FC }           from 'react';

/* ────────────────────────────────────────────── */
/** 4 cặp đối lập của MBTI để chấm điểm */
const PAIRS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

function computeMbti(answers: number[]): string {
  const tally: Record<string, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  };

  answers.forEach((ans, idx) => {
    const [a, b] = QUESTIONS[idx].pair;        // ví dụ ['E','I']
    tally[ans === 0 ? a : b] += 1;
  });

  return PAIRS.map(([a, b]) => (tally[a] >= tally[b] ? a : b)).join('');
}
/* ────────────────────────────────────────────── */

const MbtiClient: FC = () => {
  const router     = useRouter();
  const params     = useSearchParams();
  const pathname   = usePathname();

  /* Đang ở /mbti/quiz  →  khởi động làm bài luôn */
  const onQuizRoute  = pathname?.endsWith('/quiz');
  /* Query ?start=1 (giữ cho link cũ) hoặc đang ở /quiz */
  const startNow     = params?.get('start') === '1' || onQuizRoute;

  /** step = 0‥59, null = Intro */
  const [step, setStep] = useState<number | null>(startNow ? 0 : null);

  /** 60 đáp án (0 / 1). -1 = chưa trả lời */
  const [answers, setAnswers] = useState<number[]>(
    Array(QUESTIONS.length).fill(-1),
  );

  /* Đủ 60 đáp án  →  tính MBTI, chuyển sang trang /mbti/thanks */
  useEffect(() => {
    if (!answers.includes(-1)) {
      const mbti = computeMbti(answers);
      router.replace(`/mbti/thanks?code=${mbti}`);
    }
  }, [answers, router]);

  /* ============================================================ */
  /* Intro */
  if (step === null) {
    return (
      <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
        <MbtiIntro onStart={() => router.push('/mbti/quiz')} />
      </Suspense>
    );
  }

  /* Quiz – hiển thị câu hỏi hiện tại */
  const q   = QUESTIONS[step];
  const pct = Math.round(((step + 1) / QUESTIONS.length) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-8 p-4">
      <p className="text-center text-sm text-gray-500">
        Câu {step + 1}/{QUESTIONS.length} &nbsp;•&nbsp; {pct}%
      </p>

      <h2 className="text-lg font-semibold">{q.text}</h2>

      <div className="grid gap-4">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => {
              /* lưu đáp án */
              setAnswers(prev => {
                const next = [...prev];
                next[step] = idx;
                return next;
              });
              /* sang câu kế nếu còn */
              setStep(prev =>
                prev! + 1 < QUESTIONS.length ? prev! + 1 : prev,
              );
            }}
            className="rounded border px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {opt}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(prev => (prev! > 0 ? prev! - 1 : prev))}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Quay lại
        </button>
      )}
    </div>
  );
};

export default MbtiClient;
