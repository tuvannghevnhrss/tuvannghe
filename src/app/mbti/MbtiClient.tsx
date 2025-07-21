/* src/app/mbti/MbtiClient.tsx
   Hiển thị & xử lý 60 câu hỏi MBTI                                        */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState }        from 'react';
import cx                             from 'classnames';
import { QUESTIONS, Question }        from './questions';   // named export

/* ---------- hằng số & kiểu ---------- */
const TOTAL = QUESTIONS.length;       // 60
type Letter = 'E'|'I'|'S'|'N'|'T'|'F'|'J'|'P';

/* ---------- tiện ích ---------- */
const nextIndex = (i:number)=> (i+1<TOTAL ? i+1 : -1);

/* ---------- component ---------- */
export default function MbtiClient() {
  const router      = useRouter();
  const params      = useSearchParams();
  const startParam  = Number(params.get('start') ?? '0');

  const [cursor , setCursor ] = useState(
    Number.isFinite(startParam) && startParam>=0 && startParam<TOTAL
      ? startParam : 0
  );
  const [answers, setAnswers] = useState<number[]>(Array(TOTAL).fill(-1));

  /* Khi làm xong 60 câu → tính mã MBTI, gửi server, chuyển trang */
  useEffect(() => {
    if (cursor !== -1) return;

    // đếm tần suất 8 chữ cái
    const tally: Record<Letter,number> =
      {E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};

    QUESTIONS.forEach((q, idx) => {
      const choice = answers[idx];
      if (choice === -1) return;          // an toàn
      tally[q.pair[choice] as Letter] ++;
    });

    const code =
      (tally.E>=tally.I?'E':'I') +
      (tally.S>=tally.N?'S':'N') +
      (tally.T>=tally.F?'T':'F') +
      (tally.J>=tally.P?'J':'P');

    // gửi kết quả + đáp án thô (tuỳ backend)
    fetch('/api/mbti/submit', {
      method : 'POST',
      body   : JSON.stringify({ code, answers }),
    }).catch(()=>{});                     // không block UI

    router.replace(`/mbti/result?code=${code}`);
  }, [cursor, answers, router]);

  /* ---------- render ---------- */
  if (cursor === -1) return null;          // đang chuyển trang

  const q:Question = QUESTIONS[cursor];   // {question, options[2], pair[2]}

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-16 pt-6 text-center">
      {/* tiến trình */}
      <div className="relative h-2 w-full rounded bg-gray-200">
        <div
          className="absolute inset-0 rounded bg-blue-600 transition-all"
          style={{ width:`${((cursor+1)/TOTAL)*100}%` }}
        />
      </div>

      <p className="text-sm text-gray-600">
        Câu {cursor+1}/{TOTAL} · {Math.round(((cursor+1)/TOTAL)*100)}%
      </p>

      {/* câu hỏi */}
      <h2 className="text-lg font-semibold">{q.question}</h2>

      {/* 2 lựa chọn */}
      <div className="space-y-4">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={cx(
              'w-full rounded border px-4 py-3 text-lg transition',
              'hover:bg-blue-50 active:scale-[.97]',
              answers[cursor]===i && 'border-blue-600 bg-blue-50'
            )}
            onClick={()=>{
              const next = [...answers];
              next[cursor] = i;
              setAnswers(next);
              setCursor(nextIndex(cursor));
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {cursor>0 && (
        <button
          className="mt-8 text-sm text-gray-500 underline underline-offset-2 hover:text-black"
          onClick={()=> setCursor(cursor-1)}
        >
          ← Quay lại
        </button>
      )}
    </div>
  );
}
