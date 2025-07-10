"use client";                                      // Trang client 100 %

import { default as nd } from "next/dynamic";     // 👉 Đổi tên tránh “dynamic”
import { Suspense } from "react";

/* Tạo component động chỉ chạy ở client */
const Mbti = nd(() => import("./MbtiClient"), {
  ssr: false,
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <Mbti />
    </Suspense>
  );
}
