'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

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

function computeMbti(ans: number[]) {
  const c: Record<string, number> = { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };
  ans.forEach((v, i) => {
    const [a, b] = QUESTIONS[i].pair;
    c[v === 0 ? a : b] += 1;
  });
  return PAIRS.map(([a, b]) => (c[a] >= c[b] ? a : b)).join('');
}
/* ────────────────────────────────────────────────────────────── */

export default function MbtiClient() {
  const router  = useRouter();
  const params  = useSearchParams();
  const path    = usePathname();          //  ← NEW

  // auto-start khi (1) URL có ?start=1  **hoặc**  (2) chúng ta đang ở /mbti/quiz
  const shouldStart = params?.get('start') === '1' || path.endsWith('/quiz');

  const [step, setStep]       = useState<number | null>(shouldStart ? 0 : null);
  const [answers, setAnswers] = useState<number[]>(
    Array(QUESTIONS.length).fill(-1),
  );

  /* đủ 60 câu ➜ kết quả */
  useEffect(() => {
    if (!answers.includes(-1)) {
      router.replace(`/mbti/result?type=${computeMbti(answers)}`);
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
                const next = [...prev];
                next[step] = idx;          // 0 / 1
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
