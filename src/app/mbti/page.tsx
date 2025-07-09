/* --------------  Server Component (no hooks) -------------- */
import dynamic from "next/dynamic";

/** Bỏ SSG/ISR cho route này */
export const dynamic = "force-dynamic";

/**
 * Xuất luôn dynamic-component.
 *  - ssr:false   → chỉ render ở client
 *  - loading     → fallback tạm
 */
export default dynamic(() => import("./MbtiClient"), {
  ssr:    false,
  loading: () => <p className="p-6">Đang tải MBTI…</p>,
});
