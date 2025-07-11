// ❌ KHÔNG thêm "use client" (đây là Server Component)
export const dynamic = "force-dynamic"; // luôn render mỗi request

import dynamic from "next/dynamic";

// ---- tắt SSR cho PaymentContent (client-side only) ----
const PaymentContent = dynamic(() => import("./PaymentContent"), {
  ssr: false,
});

type Props = { searchParams: { product?: string } };

export default function PaymentPage({ searchParams }: Props) {
  const product = searchParams.product ?? "mbti"; // lấy ngay trên server
  return <PaymentContent product={product} />;
}
