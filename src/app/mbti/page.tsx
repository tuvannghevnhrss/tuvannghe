/* ---------------  Server Component --------------- */
import dynamic from "next/dynamic";

/* nạp MbtiClient chỉ ở client-side, tránh SSG */
const MbtiClient = dynamic(() => import("./MbtiClient"), {
  ssr: false,                     // ⬅️ quan trọng!
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});

/* Tắt hoàn toàn SSG/ISR cho route này */
export const dynamic = "force-dynamic";

export default function MbtiPage() {
  return <MbtiClient />;
}
