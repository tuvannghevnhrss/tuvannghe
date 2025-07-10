// ⬅️ KHÔNG “use client” ở đây
export const dynamic = "force-dynamic";  // buộc render mỗi request

import PaymentContent from "./PaymentContent";

type Props = { searchParams: { product?: string } };

export default function PaymentPage({ searchParams }: Props) {
  // lấy product ngay trên server
  const product = searchParams.product ?? "mbti";
  return <PaymentContent product={product} />;
}
