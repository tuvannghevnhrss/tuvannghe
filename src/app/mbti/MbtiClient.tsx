'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MbtiIntro                  from './MbtiIntro';
import { QUESTIONS }              from './questions';
import type { Question }          from './questions';

/* ── MBTI tính kết quả ──────────────────────────────────────────── */
const PAIRS = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

function calcType(ans: number[]) {
  const c: Record<string, number> = { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };
  ans.forEach((v, i) => {
    const [a, b] = QUESTIONS[i].pair;   // cặp EI / SN / …
    c[v === 0 ? a : b] += 1;
  });
  return PAIRS.map(([a, b]) => (c[a] >= c[b] ? a : b)).join('');
}
/* ───────────────────────────────────────────────────────────────── */

export default function MbtiClient() {
  const router      = useRouter();
  const params      = useSearchParams();
  const pathname    = usePathname();
  const autostart   = params?.get('start') === '1' || pathname.endsWith('/quiz');

  const [step   , setStep]    = useState<number | null>(autostart ? 0 : null);
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(-1));

  /* đủ 60 câu → /mbti/result?type=XXXX */
  useEffect(() => {
    if (!answers.includes(-1)) {
      router.replace(`/mbti/result?type=${calcType(answers)}`);
    }
  }, [answers, router]);

  /* ---------- render ---------- */
  if (step === null) return <MbtiIntro onStart={() => setStep(0)} />;

  const q         : Question = QUESTIONS[step];
  const pct       = Math.round(((step + 1) / QUESTIONS.length) * 100);
  const canBack   = step > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-8">
      {/* progress */}
      <div className="space-y-2">
        <p className="text-center text-sm text-gray-500">
          Câu {step + 1}/{QUESTIONS.length} • {pct}%
        </p>
        <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
          <div
            style={{ width: `${pct}%` }}
            className="h-full bg-blue-600 transition-all"
          />
        </div>
      </div>

      {/* question */}
      <h1 className="text-lg font-semibold">{q.text}</h1>

      {/* options */}
      <div className="grid gap-4">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setAnswers(prev => {
                const next = [...prev];
                next[step] = idx;       // 0 / 1
                return next;
              });
              setStep(s => (s! + 1 < QUESTIONS.length ? s! + 1 : s));
            }}
            className="rounded border px-4 py-3 text-left
                       hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            {opt}
          </button>
        ))}
      </div>

      {/* navigation */}
      <div className="flex justify-between pt-4">
        <button
          disabled={!canBack}
          onClick={() => canBack && setStep(s => s! - 1)}
          className={`rounded px-4 py-2 text-sm
                     ${canBack ? 'hover:bg-gray-100' : 'opacity-40 cursor-default'}`}
        >
          ← Quay lại
        </button>
        <span className="text-sm text-gray-400">
          {step + 1}/{QUESTIONS.length}
        </span>
      </div>
    </div>
  );
}
