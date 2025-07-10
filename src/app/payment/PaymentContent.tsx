"use client";

import { useState } from "react";
import { formatVND } from "@/lib/formatVND";

const PRICES = {
  mbti:     10_000,
  holland:  20_000,
  knowdell: 100_000,
  combo:    90_000,
};

type Props = { product: string };

export default function PaymentContent({ product }: Props) {
  const [code,   setCode]   = useState("");
  const [qr,     setQr]     = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading,setLoading]= useState(false);

  const checkout = async () => {
    setLoading(true);

    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: code }),
    });

    if (!res.ok) {                 // ghi log khi API trả 4xx/5xx
      console.error(await res.text());
      setLoading(false);
      return;
    }

    const { qr_url, amount } = await res.json();
    setQr(qr_url);
    setAmount(amount);
    setLoading(false);
  };

  /* JSX */
  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">
        Thanh toán {product.toUpperCase()}
      </h1>

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
            onClick={checkout}
            disabled={loading}
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
    </div>
  );
}
