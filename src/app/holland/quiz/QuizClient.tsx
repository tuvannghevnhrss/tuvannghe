"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "../questions";           // 54 câu với .trait

/* ── Tiện ích progress mini ─────────────────────────────────────────────── */
const Progress = ({ now, total }: { now: number; total: number }) => (
  <div className="my-6 h-2 w-full rounded bg-gray-200">
    <div
      className="h-2 rounded bg-indigo-600"
      style={{ width: `${(now / total) * 100}%` }}
    />
  </div>
);

/* ── Button Likert (0-4) ────────────────────────────────────────────────── */
const LikertBox = ({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-10 w-10 items-center justify-center rounded border 
                font-medium transition
                ${active ? "bg-indigo-600 text-white" : "bg-white hover:bg-gray-100"}`}
  >
    {value}
  </button>
);

/* ── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const QuizClient = () => {
  const router        = useRouter();
  const [idx, setIdx] = useState(0);              // câu hiện tại (0-53)
  const [ans, setAns] = useState<number[]>([]);   // lưu lựa chọn 0-4

  /* chọn 0-4 → lưu & sang câu tiếp */
  const choose = (v: number) => {
    setAns((a) => [...a, v]);
    setIdx((i) => i + 1);
  };

  /* xong 54 câu → tính điểm & redirect */
  if (idx === QUESTIONS.length) {
    const score: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    ans.forEach((v, i) => {
      score[QUESTIONS[i].trait] += v;             // cộng nguyên giá trị 0-4
    });

    /* sort ↓ lấy TOP-3 */
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
    <div className="mx-auto max-w-2xl px-4 py-12 text-center space-y-10">
      <h2 className="text-xl font-semibold">{q.text}</h2>

      {/* dãy 0-4 */}
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3, 4].map((n) => (
          <LikertBox key={n} value={n} active={false} onClick={() => choose(n)} />
        ))}
      </div>

      <Progress now={idx + 1} total={QUESTIONS.length} />
      <p className="text-sm text-gray-500">
        Câu {idx + 1}/{QUESTIONS.length}
      </p>
    </div>
  );
};

export default QuizClient;
