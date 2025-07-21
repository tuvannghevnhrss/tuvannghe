"use client";

import { useState, useEffect } from "react";
import { QUESTIONS, Question } from "../questions";
import { useRouter } from "next/navigation";

type AnswerMap = Record<number, 0 | 1>; // id → index đáp án

export default function MbtiClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);                 // 0‥59
  const [ans,  setAns ] = useState<AnswerMap>({});

  const q: Question = QUESTIONS[step];

  function choose(optIdx: 0 | 1) {
    setAns({ ...ans, [q.id]: optIdx });
    setStep(step + 1);
  }

  /* Khi hoàn thành   →  tính code & gửi API */
  useEffect(() => {
    if (step < QUESTIONS.length) return;

    const dim = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
    QUESTIONS.forEach(({ id, pair }, idx) => {
      const picked = pair[ans[id] ?? 0];
      (dim as any)[picked] += 1;
    });

    const code =
      (dim.E >= dim.I ? "E" : "I") +
      (dim.S >= dim.N ? "S" : "N") +
      (dim.T >= dim.F ? "T" : "F") +
      (dim.J >= dim.P ? "J" : "P");

    fetch("/api/mbti", {            // lưu kết quả
      method: "POST",
      body  : JSON.stringify({ code }),
    }).finally(() => {
      router.replace(`/mbti/thanks?code=${code}`);
    });
  }, [step, ans, router]);

  if (!q) return null; // Loading...

  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100);

  return (
    <main className="mx-auto max-w-2xl py-10 space-y-6">
      <p className="text-center text-sm text-gray-500">
        Câu {step + 1}/{QUESTIONS.length} · {progress}%
      </p>

      <h2 className="text-lg font-medium text-center">{q.question}</h2>

      <div className="space-y-4">
        {q.options.map((opt, idx) => (
          <button
            key={opt}
            onClick={() => choose(idx as 0 | 1)}
            className="block w-full rounded border px-4 py-3 text-left
                       hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
          >
            {opt}
          </button>
        ))}
      </div>
    </main>
  );
}
