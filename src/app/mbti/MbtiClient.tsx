/*  MBTI Client – toàn bộ UI & logic làm bài MBTI
    ĐƯỢC import ở:
      • /app/mbti/page.tsx      (Intro  →  bắt đầu làm bài)
      • /app/mbti/quiz/page.tsx (Làm bài trực tiếp)
---------------------------------------------------------------- */
'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useSearchParams }   from 'next/navigation';

import MbtiIntro            from './MbtiIntro';
import { QUESTIONS }        from './questions';
import type { Question }    from './questions';

/* ────────────────────────────────────────────────────────────── */
const PAIRS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

/** Đếm 60 đáp án & trả về kiểu MBTI 4 chữ */
function computeMbti(answers: number[]): string {
  const counts: Record<string, number> = { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };

  answers.forEach((ans, idx) => {
    const [a, b] = QUESTIONS[idx].pair;
    counts[ans === 0 ? a : b] += 1;
  });

  return PAIRS.map(([a, b]) => (counts[a] >= counts[b] ? a : b)).join('');
}

/* ────────────────────────────────────────────────────────────── */

export default function MbtiClient() {
  const router       = useRouter();
  const params       = useSearchParams();
  const startQuizNow = params?.get('start') === '1';

  /** null = Intro, 0-59 = đang làm câu hỏi */
  const [step, setStep]       = useState<number | null>(startQuizNow ? 0 : null);
  const [answers, setAnswers] = useState<number[]>(
    Array(QUESTIONS.length).fill(-1),
  );

  /* đủ 60 câu → tính kết quả & redirect */
  useEffect(() => {
    if (!answers.includes(-1)) {
      const mbti = computeMbti(answers);
      router.replace(`/mbti/result?type=${mbti}`);
    }
  }, [answers, router]);

  /* ──────────────── render ──────────────── */
  if (step === null) return <MbtiIntro onStart={() => setStep(0)} />;

  const q: Question = QUESTIONS[step];
  const pct         = Math.round(((step + 1) / QUESTIONS.length) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-8 p-4">
      <p className="text-center text-sm text-gray-500">
        Câu {step + 1}/{QUESTIONS.length} • {pct}%
      </p>

      <h2 className="text-lg font-semibold">{q.text}</h2>

      <div className="grid gap-4">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setAnswers(prev => {
                const next = [...prev];      // ← đã sửa lỗi cú pháp
                next[step] = idx;            // 0 hoặc 1
                return next;
              });
              setStep(s => (s! + 1 < QUESTIONS.length ? s! + 1 : s));
            }}
            className="rounded border px-4 py-3 text-left hover:bg-gray-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
