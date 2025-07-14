'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ThankScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/knowdell/result'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="flex h-screen flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-3xl font-bold">🎉 Bạn đã hoàn thành bài Knowdell!</h1>
      <p className="text-lg">Chúng tôi đang ghi nhận 10 giá trị của bạn…</p>
      <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát.</p>
    </main>
  );
}
