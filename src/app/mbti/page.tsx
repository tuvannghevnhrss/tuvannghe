"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "./questions";

export default function MBTIQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1)[]>([]);
  const router = useRouter();
  const current = QUESTIONS[step];

  const choose = (choice: 0 | 1) => {
    const next = [...answers, choice];
    setAnswers(next);
    if (step + 1 === QUESTIONS.length) {
      submit(next);
    } else {
      setStep(step + 1);
    }
  };

  const calcMBTI = (ans: (0 | 1)[]): string => {
    // Ví dụ mapping đơn giản: 
    // câu lẻ quyết định E/I, chẵn quyết định J/P, v.v.
    // Tuỳ bạn tự viết logic chính xác theo thang điểm MBTI
    let E = 0, I = 0, S = 0, N = 0, T = 0, F = 0, J = 0, P = 0;
    ans.forEach((v, i) => {
      switch (i % 4) {
        case 0: v === 0 ? E++ : I++; break;
        case 1: v === 0 ? S++ : N++; break;
        case 2: v === 0 ? T++ : F++; break;
        case 3: v === 0 ? J++ : P++; break;
      }
    });
    const code =
      (E >= I ? "E" : "I") +
      (S >= N ? "S" : "N") +
      (T >= F ? "T" : "F") +
      (J >= P ? "J" : "P");
    return code;
  };

const submit = async (all: (0 | 1)[]) => {
  const mbti_code = calcMBTI(all);

  const res = await fetch("/api/mbti", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mbti_code }),
  });

  if (!res.ok) {
    alert("Có lỗi khi lưu kết quả, vui lòng thử lại!");
    return;         // dừng, không reset step
  }
  router.push(`/mbti/result?code=${mbti_code}`);
};

  return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <p className="mb-4 font-semibold">
        Câu {step + 1} / {QUESTIONS.length}
      </p>
      <h1 className="text-2xl font-bold mb-6">{current.question}</h1>
      <div className="space-y-4">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => choose(idx as 0 | 1)}
            className="w-full border rounded px-4 py-3 hover:bg-blue-50 transition"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
