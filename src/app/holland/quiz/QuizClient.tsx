"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "../questions";

/* ─────────────────────────────────────────────────────────────── */
/* 1. ProgressBar mini – chiều dài = (now / total) × 100%          */
const ProgressBar = ({ now, total }: { now: number; total: number }) => (
  <div className="w-full rounded bg-gray-200 h-2">
    <div
      className="h-2 rounded bg-indigo-600"
      style={{ width: `${(now / total) * 100}%` }}
    />
  </div>
);

/* 2. Button mini – có 2 style: solid | outline                    */
const MiniButton = ({
  children,
  outline,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { outline?: boolean }) => (
  <button
    {...rest}
    className={`w-full rounded-lg py-3 text-lg font-medium transition ${
      outline
        ? "border-2 border-gray-300 hover:bg-gray-100"
        : "bg-indigo-600 text-white hover:bg-indigo-700"
    }`}
  >
    {children}
  </button>
);
/* ─────────────────────────────────────────────────────────────── */

const QuizClient = () => {
  const router        = useRouter();
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<(0 | 1)[]>([]);

  /* xử lý chọn */
  const handle = (choice: 0 | 1) => {
    setAns((a) => [...a, choice]);
    setIdx((i) => i + 1);
  };

  /* hết câu → tính điểm & chuyển trang */
  if (idx === QUESTIONS.length) {
    const score: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    ans.forEach((c, i) => {
      if (c === 0) score[QUESTIONS[i].trait] += 1; // 0 = Phù hợp
    });
    const code = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join("");

    router.replace(`/holland/thanks?code=${code}&score=${btoa(JSON.stringify(score))}`);
    return null;
  }

  const q = QUESTIONS[idx];

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10 text-center">
      <ProgressBar now={idx + 1} total={QUESTIONS.length} />

      <h2 className="text-xl font-semibold">{q.text}</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MiniButton onClick={() => handle(0)}>Phù hợp</MiniButton>
        <MiniButton outline onClick={() => handle(1)}>
          Không phù hợp
        </MiniButton>
      </div>
    </div>
  );
};

export default QuizClient;
