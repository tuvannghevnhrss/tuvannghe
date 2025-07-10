// src/app/payment/page.tsx
import { Suspense } from "react";
import dynamic from "next/dynamic";

/** tắt SSR cho PaymentContent: ssr: false */
const PaymentContent = dynamic(() => import("./PaymentContent"), { ssr: false });

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center">Đang tải...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
