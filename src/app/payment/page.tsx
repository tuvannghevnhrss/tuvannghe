// src/app/payment/page.tsx  (RSC, KHÔNG cần "use client")
import { Suspense } from "react";
import PaymentContent from "./PaymentContent";

export const dynamic = "force-dynamic";  // ngăn Next.js prerender tĩnh

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Đang tải…</div>}>
      <PaymentContent />
    </Suspense>
  );
}
