'use client';
import { useEffect } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';

export default function ThankScreen(){
  const router = useRouter();
  const search = useSearchParams();
  const code   = (search.get('code')??'').toUpperCase();

  useEffect(()=>{
    if(!/^[EISNTFJP]{4}$/.test(code)){ router.replace('/mbti'); return; }
    const t=setTimeout(()=>router.replace(`/mbti/result?code=${code}`),2500);
    return ()=>clearTimeout(t);
  },[code,router]);

  return (
    <main className="flex h-screen flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-3xl font-bold">🎉 Bạn đã hoàn thành MBTI!</h1>
      <p className="text-lg">Đang phân tích kết quả…</p>
      <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
    </main>
  );
}
