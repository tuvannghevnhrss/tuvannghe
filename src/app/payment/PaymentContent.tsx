"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatVND } from "@/lib/formatVND";

const PRICES = {
  mbti: 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo: 90_000,
};

export default function PaymentContent() {
  const params   = useSearchParams();
  const product  = params.get("product") ?? "mbti";

  const [code,   setCode]   = useState("");
  const [qr,     setQr]     = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading,setLoading]= useState(false);

  const checkout = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: code }),
    });

    if (!res.ok) {
      console.error(await res.text());   // debug thấy 405/500 ở đây
      setLoading(false);
      return;
    }

    const { qr, amount } = await res.json();
    setQr(qr);
    setAmount(amount);
    setLoading(false);
  };

  return (
    <section className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Thanh toán {product.toUpperCase()}</h1>

      {!qr ? (
        <>
          <p className="mb-4">
            Giá gốc: {formatVND(PRICES[product as keyof typeof PRICES])} ₫
          </p>

          <input
            className="border p-2 w-full mb-4"
            placeholder="Mã giảm giá"
            value={code}
            onChange={e => setCode(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={checkout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
          >
            {loading ? "Đang tạo QR…" : "Tạo mã QR"}
          </button>
        </>
      ) : (
        <div className="text-center">
          <p className="mb-4">
            Quét QR để thanh toán {formatVND(amount!)} ₫
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code" className="mx-auto w-56 h-56" />
          <p className="mt-4 text-sm text-gray-600">
            Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.
          </p>
        </div>
      )}
    </section>
  );
}
