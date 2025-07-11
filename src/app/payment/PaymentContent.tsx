// src/app/payment/PaymentContent.tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import formatVND from "@/lib/formatVND";

export default function PaymentContent() {
  const params  = useSearchParams();
  const product = params.get("product") ?? "mbti";

  const [code,    setCode]    = useState("");
  const [amount,  setAmount]  = useState<number | null>(null);
  const [qr,      setQr]      = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, coupon: code.trim() }),
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

  /* -------- UI -------- */
  return qr ? (
    <div className="text-center">
      <h2 className="mb-4">
        Quét QR để thanh toán&nbsp;
        {formatVND(amount!)}&nbsp;đ
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR code" className="mx-auto w-48 h-48" />
      <p className="mt-4 text-sm text-gray-600">
        Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.
      </p>
    </div>
  ) : (
    <>
      <p className="mb-2">
        Giá gốc: {formatVND(PRICE[product as keyof typeof PRICE])} đ
      </p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Mã giảm giá"
        className="border rounded w-full px-3 py-2 mb-3"
      />

      {amount !== null && (
        <p className="mb-3 font-medium">
          Số tiền cần trả:&nbsp;{formatVND(amount)} đ
        </p>
      )}

      <button
        onClick={checkout}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white"
      >
        {loading ? "Đang xử lý…" : "Đi đến quét mã Thanh toán"}
      </button>
    </>
  );
}

/* Bảng giá cục bộ để hiển thị (đồng nhất với API) */
const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
