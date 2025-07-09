/* ---------------  Server Component --------------- */
import { Suspense } from "react";
import dynamic       from "next/dynamic";

const MbtiClient = dynamic(() => import("./MbtiClient"), {
  ssr: false,
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});

export const dynamic = "force-dynamic";

export default function MbtiPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải MBTI…</p>}>
      <MbtiClient />
    </Suspense>
  );
}
