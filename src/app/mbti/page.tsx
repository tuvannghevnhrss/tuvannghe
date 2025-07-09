import { Suspense } from "react";
import MbtiClient from "./MbtiClient";      // cùng thư mục với file này

/** Ngăn Next.js cố prerender trang MBTI lúc build */
export const dynamic = "force-dynamic";

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />                        {/* Toàn bộ logic client */}
    </Suspense>
  );
}
