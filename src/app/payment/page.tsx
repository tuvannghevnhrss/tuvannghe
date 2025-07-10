// src/app/payment/page.tsx
import PaymentContent from "./PaymentContent";

export const dynamic = "force-dynamic"; // tránh prerender static

export default function PaymentPage() {
  return <PaymentContent />;
}
