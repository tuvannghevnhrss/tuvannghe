/* --------------  Server Component (no hooks) -------------- */
import { default as nextDynamic } from "next/dynamic";  // ← đổi tên

/** Ngăn SSG/ISR cho route này */
export const dynamic = "force-dynamic";

/**
 * Xuất trực tiếp component động
 *  - ssr:false  → chỉ chạy ở client
 *  - loading    → skeleton
 */
export default nextDynamic(() => import("./MbtiClient"), {
  ssr: false,
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});
