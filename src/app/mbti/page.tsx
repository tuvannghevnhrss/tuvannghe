/* ---------------  Server Component --------------- */
import { Suspense } from "react";
import dynamic       from "next/dynamic";

/* nạp MbtiClient chỉ ở client-side */
const MbtiClient = dynamic(() => import("./MbtiClient"), {
  ssr: false,
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});

/* tắt SSG cho route này */
export const dynamic = "force-dynamic";

export default function MbtiPage() {
  /* ✅ BỌC Suspense – Next yêu cầu */
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
