"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "../questions";

/* — Progress bar mini — */
const Progress = ({ now, total }: { now: number; total: number }) => (
  <div className="h-2 w-full rounded bg-gray-200">
    <div
      className="h-2 rounded bg-indigo-600 transition-all"
      style={{ width: `${(now / total) * 100}%` }}
    />
  </div>
);

/* — Likert box (0-4) — */
function LikertBox({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded border font-medium transition
        ${
          active
            ? "bg-indigo-600 text-white"
            : "bg-white hover:bg-indigo-50 active:bg-indigo-100"
        }`}
    >
      {value}
    </button>
  );
}

/* — MAIN — */
export default function QuizClient() {
  const router = useRouter();

  const total           = QUESTIONS.length;   // 54
  const [idx, setIdx]   = useState(0);        // câu hiện tại
  const [ans, setAns]   = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null); // số vừa chọn

  /* chọn một giá trị 0-4 */
  const choose = (v: number) => {
    setPicked(v);                           // tô xanh ngay
    setTimeout(() => {
      setAns((a) => [...a, v]);
      setIdx((i) => i + 1);
      setPicked(null);                      // reset highlight
    }, 150);                                // hiển thị 150 ms
  };

  /* tính kết quả khi xong */
  if (idx === total) {
    const score: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    ans.forEach((v, i) => (score[QUESTIONS[i].trait] += v));
    const code = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join("");

    router.replace(
      `/holland/thanks?code=${code}&score=${btoa(JSON.stringify(score))}`
    );
    return null;
  }

  const q = QUESTIONS[idx];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8 text-center">
      {/* ① Progress + chỉ số */}
      <div className="space-y-2">
        <Progress now={idx + 1} total={total} />
        <p className="text-sm text-gray-600">
          Câu {idx + 1}/{total}
        </p>
      </div>

      {/* Câu hỏi */}
      <h2 className="text-xl font-semibold">{q.text}</h2>

      {/* ② Likert 0-4 */}
      <div className="mt-6 flex justify-center gap-4">
        {[0, 1, 2, 3, 4].map((n) => (
          <LikertBox
            key={n}
            value={n}
            active={picked === n}
            onClick={() => choose(n)}
          />
        ))}
      </div>
    </div>
  );
}
