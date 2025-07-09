"use client";

import { useState, useEffect } from "react";
import {
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import MbtiIntro from "@/components/MbtiIntro";
import { QUESTIONS } from "./questions";

/* ---------- 1. Root component gán cho Suspense ---------- */
export default function MbtiClient() {
  const params   = useSearchParams();
  const started  = params.get("start") === "1";

  if (!started) return <MbtiIntro />;      // trang giới thiệu
  return <MBTIQuiz />;                     // bắt đầu làm bài
}

/* ---------- 2. Component quiz (private) ---------- */
function MBTIQuiz() {
  /* --- Khởi tạo --- */
  const router    = useRouter();
  const pathname  = usePathname();
  const supabase  = createClientComponentClient();

  /* --- 1. Bắt buộc đăng nhập --- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session)
        router.replace(`/login?redirectedFrom=${pathname}`);
    });
  }, [pathname, router, supabase]);

  /* --- 2. State câu hỏi --- */
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<(0 | 1)[]>([]);
  const current = QUESTIONS[step];

  const choose = (choice: 0 | 1) => {
    const next = [...answers, choice];
    if (step + 1 === QUESTIONS.length) submit(next);
    else {
      setAnswers(next);
      setStep(step + 1);
    }
  };

  /* --- 3. Tính MBTI (demo) --- */
  const calcMBTI = (ans: (0 | 1)[]): string => {
    let E = 0, I = 0, S = 0, N = 0, T = 0, F = 0, J = 0, P = 0;
    ans.forEach((v, i) => {
      switch (i % 4) {
        case 0: v === 0 ? E++ : I++; break;
        case 1: v === 0 ? S++ : N++; break;
        case 2: v === 0 ? T++ : F++; break;
        case 3: v === 0 ? J++ : P++; break;
      }
    });
    return (E >= I ? "E" : "I") +
           (S >= N ? "S" : "N") +
           (T >= F ? "T" : "F") +
           (J >= P ? "J" : "P");
  };

  /* --- 4. Submit & điều hướng --- */
  const submit = async (all: (0 | 1)[]) => {
    const code = calcMBTI(all);
    const res  = await fetch("/api/mbti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      alert("Có lỗi khi lưu kết quả, vui lòng đăng nhập rồi thử lại!");
      return;
    }
    router.push(`/mbti/result?code=${code}`);
  };

  /* --- 5. UI --- */
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p className="mb-4 font-semibold">
        Câu {step + 1} / {QUESTIONS.length}
      </p>
      <h1 className="mb-6 text-2xl font-bold">{current.question}</h1>

      {current.options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => choose(idx as 0 | 1)}
          className="w-full rounded border px-4 py-3 transition hover:bg-blue-50"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
