"use client";
import { Suspense } from "react";
import MbtiClient from "./MbtiClient";

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
