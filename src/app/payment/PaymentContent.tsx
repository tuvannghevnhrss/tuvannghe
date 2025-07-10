// src/app/payment/PaymentContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatVND } from "@/lib/formatVND";

const PRICES = {
  mbti:     10_000,
  holland:  20_000,
  knowdell: 100_000,
  combo:    90_000,
};

export default function PaymentContent() {
  const params  = useSearchParams();
  const product = params.get("product") ?? "mbti";

  const [code,   setCode]   = useState("");
  const [qr,     setQr]     = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  /** 🔑 chuyển sang /api/payments/checkout */
  const checkout = async () => {
    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: code }),
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    const { qr, amount } = await res.json();
    setQr(qr);
    setAmount(amount);
  };

  /* …phần JSX giữ nguyên… */
}
