"use client";                                // <-- trang /mbti là Client

import { Suspense } from "react";
import MbtiClient from "./MbtiClient";

/* Vẫn khai báo dynamic để Next khỏi collect page data ở build */
export const dynamic = "force-dynamic";

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />                         {/* chứa useSearchParams */}
    </Suspense>
  );
}
