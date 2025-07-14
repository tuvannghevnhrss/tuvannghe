"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { QUESTIONS: typeof import("../questions").QUESTIONS };

export default function QuizClient({ QUESTIONS }: Props) {
  const router = useRouter();

  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<number[]>([]);
  const current                 = QUESTIONS[step];

  const choose = (v: 0 | 1) => {
    const next = [...answers, v];

    if (step + 1 === QUESTIONS.length) {
      submit(next);
    } else {
      setAnswers(next);
      setStep(step + 1);
    }
  };

  const calcHolland = (ans: number[]) => {
    const score: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    ans.forEach((v, i) => {
      const key = Object.keys(score)[i % 6] as keyof typeof score;
      score[key] += v;
    });
    const code = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join("");
    return { code, score };
  };

  const submit = async (ans: number[]) => {
    const { code, score } = calcHolland(ans);
    const res = await fetch("/api/holland", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, score }),
    });
    if (!res.ok) {
      alert("Có lỗi khi lưu kết quả, thử lại!");
      return;
    }
    router.push(`/holland/thanks?code=${code}`);
  };

  return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <p className="mb-4 font-medium">
        Câu {step + 1}/{QUESTIONS.length}
      </p>
      <h2 className="text-2xl font-bold mb-6">{current.question}</h2>

      {current.options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => choose(i as 0 | 1)}
          className="block w-full border rounded p-4 mb-4 hover:bg-purple-50"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
