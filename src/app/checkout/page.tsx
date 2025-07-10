// src/app/checkout/page.tsx
"use client";

import { useState } from "react";
import { formatVND } from "@/lib/formatVND";

const PRODUCTS = [
  { id: "mbti",     name: "MBTI",             price: 10_000 },
  { id: "holland",  name: "Holland",          price: 20_000 },
  { id: "knowdell", name: "Knowdell",         price: 100_000 },
  { id: "combo",    name: "Cả 3 trắc nghiệm", price: 90_000 },
];

export default function Checkout() {
  const [selected, setSelected] = useState("mbti");
  const [coupon,   setCoupon]   = useState("");
  const [qr,       setQr]       = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  /** 🔑 gọi đúng endpoint /api/payments/checkout */
  const pay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product: selected, coupon }),
    });

    if (!res.ok) {
      console.error(await res.text());
      setLoading(false);
      return;
    }
    const { qr } = await res.json();
    setQr(qr);
    setLoading(false);
  };

  /* …phần JSX giữ nguyên, chỉ đổi mỗi fetch phía trên … */
}
