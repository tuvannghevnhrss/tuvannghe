'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ThankScreen() {
  const router = useRouter();
  const search = useSearchParams();

  const code  = (search.get('code')  ?? '').toUpperCase();    // RIASEC
  const score =  search.get('score') ?? '';                   // base64-JSON

  useEffect(() => {
    /* nếu thiếu code hoặc score → quay về intro */
    if (!/^[RIASEC]{3}$/.test(code) || !score) {
      router.replace('/holland');
      return;
    }

    const t = setTimeout(() => {
      /* chuyển sang trang kết quả, giữ nguyên cả code & score */
      router.replace(`/holland/result?code=${code}&score=${score}`);
    }, 2500);

    return () => clearTimeout(t);
  }, [code, score, router]);

  return (
    <main className="flex h-screen flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-3xl font-bold">🎉 Bạn đã hoàn thành trắc nghiệm Holland!</h1>
      <p className="text-lg">Chúng tôi đang phân tích kết quả…</p>
      <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
    </main>
  );
}
