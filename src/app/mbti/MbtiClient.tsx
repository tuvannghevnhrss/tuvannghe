/*  MBTI Client – 60‑question quiz
    Route:
      – /mbti            : intro & nút “Bắt đầu Quiz”
      – /mbti/quiz       : làm bài; ?start=1 để nhảy thẳng vào

    Flow:
      1. Intro → click → push('/mbti/quiz?start=1')
      2. Quiz hiển thị lần lượt 60 câu hỏi (2 lựa chọn)
      3. Khi trả lời xong → POST điểm lên /api/mbti/result → push("/mbti/thanks")
---------------------------------------------------------------- */
'use client';

import { useEffect, useState }           from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import QUESTIONS                         from './questions';

// Kiểu cho 1 câu hỏi
interface Question {
  a: string;   // lựa chọn A (hướng E/S/T/J)
  b: string;   // lựa chọn B (hướng I/N/F/P)
}

const TOTAL = QUESTIONS.length;           // = 60

export default function MbtiClient() {
  /* -------------------- hooks -------------------- */
  const router   = useRouter();
  const path     = usePathname();           // “/mbti” hoặc “/mbti/quiz”
  const params   = useSearchParams();
  const startNow = params?.get('start') === '1';

  /* -------------------- state -------------------- */
  const [step, setStep] = useState(startNow ? 0 : -1);   // -1 → intro, 0‥59: câu hiện tại
  const [score, setScore] = useState({ E:0,I:0, S:0,N:0, T:0,F:0, J:0,P:0 });

  /* -------------------- handlers -------------------- */
  function handleBegin() {
    router.push('/mbti/quiz?start=1');     // đổi URL (không reload) ⇢ startNow = true
    setStep(0);
  }

  function handleChoose(opt: 'a'|'b') {
    const q = QUESTIONS[step];
    // map [step] vào chữ cái cặp EI SN TF JP
    const axis = Math.floor(step/15);      // 0,1,2,3
    const pair = ['E','S','T','J'][axis] as keyof typeof score;
    const opp  = ['I','N','F','P'][axis] as keyof typeof score;

    setScore(s => ({
      ...s,
      [opt==='a' ? pair : opp]: s[opt==='a'?pair:opp]+1,
    }));

    setStep(step+1);
  }

  /* ----------------- side‑effect: finish ---------------- */
  useEffect(() => {
    if (step !== TOTAL) return;            // chưa xong

    // tính 4 chữ cái
    const type = (
      (score.E > score.I ? 'E' : 'I') +
      (score.S > score.N ? 'S' : 'N') +
      (score.T > score.F ? 'T' : 'F') +
      (score.J > score.P ? 'J' : 'P')
    );

    // gửi lên server (có thể thất bại – không critical)
    fetch('/api/mbti/result', {
      method:'POST', body:JSON.stringify({ type })
    }).finally(()=>{
      router.replace('/mbti/thanks');
    });
  }, [step, score, router]);

  /* -------------------- render -------------------- */
  if (step === -1) {
    // Intro
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Bộ câu hỏi MBTI</h2>
        <p className="text-gray-700">Đây là bộ câu hỏi đánh giá tính cách của bạn…</p>
        <button onClick={handleBegin} className="mx-auto rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          Bắt đầu Quiz MBTI
        </button>
      </div>
    );
  }

  // Quiz đang diễn ra
  const q = QUESTIONS[step];
  const progress = ((step+1)/TOTAL)*100;

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center px-4">

      {/* thanh tiến trình */}
      <div className="h-2 w-full rounded bg-gray-200">
        <div style={{ width:`${progress}%` }} className="h-full rounded bg-blue-600 transition-all" />
      </div>
      <p className="text-sm text-gray-500">Câu {step+1}/{TOTAL} ・ {Math.round(progress)}%</p>

      {/* câu hỏi */}
      <div className="space-y-4">
        <button onClick={()=>handleChoose('a')} className="w-full rounded border px-4 py-3 text-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {q.a}
        </button>
        <button onClick={()=>handleChoose('b')} className="w-full rounded border px-4 py-3 text-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {q.b}
        </button>
      </div>

      {/* nút quay lại */}
      {step>0 && (
        <button onClick={()=>setStep(step-1)} className="text-sm text-gray-500 hover:underline mt-6">← Quay lại</button>
      )}
    </div>
  );
}
