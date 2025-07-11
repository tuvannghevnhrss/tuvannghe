"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import formatVND from "@/lib/formatVND";

const PRICES = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };

export default function PaymentContent() {
  const params  = useSearchParams();
  const product = (params.get("product") ?? "mbti") as keyof typeof PRICES;

  const [code,    setCode]    = useState("");
  const [qr,      setQr]      = useState<string | null>(null);
  const [amount,  setAmount]  = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  /** gọi API tạo QR */
  const checkout = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: code }),
    });

    if (!res.ok) {
      console.error(await res.text());
      setLoading(false);
      return;
    }

    const { qr_url, amount } = await res.json();
    setQr(qr_url);
    setAmount(amount);
    setLoading(false);
  };

  return (
    <section className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Thanh toán {product.toUpperCase()}</h1>

      {/* --- khi chưa tạo QR --- */}
      {!qr && (
        <>
          <p className="mb-2">
            Giá gốc: <span className="font-medium">{formatVND(PRICES[product])}</span>
          </p>

          <input
            placeholder="Mã giảm giá"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />

          {/* Nếu đã áp dụng coupon và API trả về amount */}
          {amount !== null && (
            <p className="mb-4">
              Số tiền cần thanh toán: <span className="font-bold text-blue-600">{formatVND(amount)}</span>
            </p>
          )}

          <button
            disabled={loading}
            onClick={checkout}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded"
          >
            {loading ? "Đang tạo QR…" : "Đi đến quét mã Thanh toán"}
          </button>
        </>
      )}

      {/* --- đã có QR --- */}
      {qr && (
        <div className="text-center">
          <p className="mb-4">Quét QR để thanh toán {formatVND(amount ?? 0)}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code" className="mx-auto w-60 h-60" />
          <p className="mt-4 text-sm text-gray-600">
            Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.
          </p>
        </div>
      )}
    </section>
  );
}
