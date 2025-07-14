'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ThankScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const code   = (search.get('code') ?? '').toUpperCase();

  useEffect(() => {
    if (!/^[EI][SN][FT][JP]$/.test(code)) {
      router.replace('/mbti');
      return;
    }
    const t = setTimeout(() => {
      router.replace(`/mbti/result?code=${code}`);
    }, 2500);                       // 2,5 giây chờ
    return () => clearTimeout(t);
  }, [code, router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center space-y-6">
      <h1 className="text-3xl font-bold">🎉 Cảm ơn bạn đã hoàn thành bài trắc nghiệm!</h1>
      <p className="text-lg">Chúng tôi đang phân tích câu trả lời của bạn…</p>
      <p className="text-sm text-gray-500">Vui lòng đợi giây lát.</p>
    </main>
  );
}
