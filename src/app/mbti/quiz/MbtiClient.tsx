'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS, Question } from '../questions';

/* progress mini */
const Progress = ({ now,total}:{now:number,total:number}) => (
  <div className="h-2 w-full rounded bg-gray-200">
    <div className="h-2 rounded bg-indigo-600 transition-all" style={{width:`${(now/total)*100}%`}}/>
  </div>
);

export default function QuizClient() {
  const router=useRouter();
  const total=QUESTIONS.length;          // 60
  const [idx,setIdx]=useState(0);
  const [ans,setAns]=useState<string[]>([]);

  const choose=(whichIdx:number)=>{
    setAns(a=>[...a, QUESTIONS[idx].pair[whichIdx]]);
    setIdx(i=>i+1);
  };

  /* xong 60 câu -> tính type */
  if(idx===total){
    const tally:Record<string,number>={E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0};
    ans.forEach(c=>tally[c]++);
    const type =
      (tally.E>tally.I?'E':'I')+
      (tally.S>tally.N?'S':'N')+
      (tally.T>tally.F?'T':'F')+
      (tally.J>tally.P?'J':'P');
    router.replace(`/mbti/thanks?code=${type}`);
    return null;
  }

  const q:Question   = QUESTIONS[idx];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 space-y-8 text-center">
      <div className="space-y-2">
        <Progress now={idx+1} total={total}/>
        <p className="text-sm text-gray-600">Câu {idx+1}/{total}・{Math.round(((idx+1)/total)*100)}%</p>
      </div>

      <h2 className="text-xl font-semibold">{q.question}</h2>

      <div className="space-y-4">
        {q.options.map((opt,i)=>(
          <button key={opt}
                  onClick={()=>choose(i)}
                  className="block w-full rounded border bg-white px-6 py-4 text-left hover:bg-indigo-50">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
