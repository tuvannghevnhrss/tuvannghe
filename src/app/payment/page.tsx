// ⬅ KHÔNG “use client” (file này vẫn là Server-Component)
export const dynamic = "force-dynamic";        // luôn render mỗi request

import PaymentContent from "./PaymentContent";

type Props = { searchParams: { product?: string } };

export default function PaymentPage({ searchParams }: Props) {
  const product = searchParams.product ?? "mbti";   // lấy ngay trên server
  return <PaymentContent product={product} />;      // truyền xuống Client-Component
}
