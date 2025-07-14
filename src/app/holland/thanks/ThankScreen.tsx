'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ThankScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const code   = (search.get('code') ?? '').toUpperCase();

  useEffect(() => {
    if (!/^[RIASEC]{3}$/.test(code)) {
      router.replace('/holland');
      return;
    }
    const t = setTimeout(() => {
      router.replace(`/holland/result?code=${code}`);
    }, 2500);
    return () => clearTimeout(t);
  }, [code, router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center space-y-6">
      <h1 className="text-3xl font-bold">🎉 Bạn đã hoàn thành trắc nghiệm Holland!</h1>
      <p className="text-lg">Chúng tôi đang phân tích kết quả…</p>
      <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
    </main>
  );
}
