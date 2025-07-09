/* --------------  Server Component -------------- */
import { Suspense } from "react";
import dynamic       from "next/dynamic";

/* Ngăn Next SSG route này */
export const dynamic = "force-dynamic";

export default function MbtiPage() {
  /* 1️⃣ Khởi tạo dynamic-component NGAY TRONG hàm,
        biến chắc chắn tồn tại trước khi JSX dùng */
  const MbtiClient = dynamic(() => import("./MbtiClient"), {
    ssr: false,
    loading: () => <p className="p-6">Đang tải MBTI…</p>,
  });

  /* 2️⃣ Bọc Suspense như yêu cầu Next 15 */
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
