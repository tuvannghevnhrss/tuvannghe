/*  MBTI Client – toàn bộ UI & logic làm bài MBTI
    ĐƯỢC import ở cả:
      • /app/mbti/page.tsx      (intro)
      • /app/mbti/quiz/page.tsx (làm bài trực tiếp)
---------------------------------------------------------------- */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import MbtiIntro        from "./MbtiIntro";
import { QUESTIONS }    from "./questions";
import type { FC }      from "react";

/* ────────────────────────────────────────────────────────────── */
const PAIRS = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
] as const;

function computeMbti(answers: number[]): string {
  const counts: Record<string, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  };

  answers.forEach((ans, idx) => {
    const [a, b] = QUESTIONS[idx].pair;         // ví dụ ['E','I']
    counts[ans === 0 ? a : b] += 1;
  });

  return PAIRS.map(([a, b]) => (counts[a] >= counts[b] ? a : b)).join("");
}
/* ────────────────────────────────────────────────────────────── */

const MbtiClient: FC = () => {
  const router       = useRouter();
  const params       = useSearchParams();          // ?start=1 ► mở thẳng quiz
  const startQuizNow = params?.get("start") === "1";

  /** step = 0‥59, null = intro */
  const [step, setStep]       = useState<number | null>(
    startQuizNow ? 0 : null,
  );
  /** mảng 60 đáp án (0 hoặc 1). -1 = chưa trả lời */
  const [answers, setAnswers] = useState<number[]>(
    Array(QUESTIONS.length).fill(-1),
  );

  /* Khi đã đủ 60 đáp án → tính MBTI & chuyển sang /mbti/thanks */
  useEffect(() => {
    if (!answers.includes(-1)) {
      const mbti = computeMbti(answers);
      router.replace(`/mbti/thanks?code=${mbti}`);
    }
  }, [answers, router]);

  /* ──────────────── render ──────────────── */
  if (step === null)
    return <MbtiIntro onStart={() => setStep(0)} />;

  const q   = QUESTIONS[step];
  const pct = Math.round(((step + 1) / QUESTIONS.length) * 100);

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
              setAnswers(a => {
                const next = [...a];
                next[step] = idx;                // 0 hoặc 1
                return next;
              });
              /* sang câu kế nếu còn, ngược lại chờ useEffect redirect */
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
};

export default MbtiClient;
