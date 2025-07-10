"use client";                                   // Trang /mbti chạy hoàn toàn ở client

import { Suspense } from "react";

export default function MbtiPage() {
  /* nạp MbtiClient TRONG hàm ⇒ không còn tham chiếu top-level */
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MbtiClient = require("./MbtiClient").default;

  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
