// src/app/checkout/page.tsx
"use client";
import { useState } from "react";
const VND = new Intl.NumberFormat("vi-VN");
const PRODUCTS = [ /* ... */ ];

export default function Checkout() {
  // ...
  const pay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: selected, coupon }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert("Thanh toán thất bại: " + (err.error || res.status));
      setLoading(false);
      return;
    }
    const { qr } = await res.json();
    setQr(qr);
    setLoading(false);
  };
  // ...
}
