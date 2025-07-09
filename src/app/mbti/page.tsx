"use client";                                         // 👈 trang là Client

import { Suspense } from "react";
import MbtiClient from "./MbtiClient";                // chứa toàn bộ hook

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
