"use client";
import { useEffect, useState } from "react";
import formatVND from "@/lib/formatVND";

type Props = { product: string };          // nhận từ Server-Component

export default function PaymentContent({ product }: Props) {
  /* state */
  const [code,    setCode]    = useState("");
  const [amount,  setAmount]  = useState<number | null>(null);   // số phải trả
  const [qr,      setQr]      = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ☆ Khi code (hoặc product) thay đổi → hỏi server số tiền */
  useEffect(() => {
    if (!code.trim()) { setAmount(null); return; }      // xoá code ⇒ xoá amount

    const t = setTimeout(async () => {
      const res  = await fetch("/api/payments/quote", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ product, coupon: code.trim() }),
      });
      const data = await res.json();
      setAmount(data.amount ?? null);                   // lỗi ⇒ null
    }, 400);                                           // debounce 400 ms

    return () => clearTimeout(t);
  }, [code, product]);

  /* Gọi /checkout để tạo QR */
  const checkout = async () => {
    setLoading(true);
    const res  = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: code.trim() }),
    });
    const data = await res.json();
    setQr(data.qr_url);
    setLoading(false);
  };

  /* ───────── UI ───────── */
  if (qr)
    return (
      <div className="text-center">
        <h2 className="mb-4">Quét QR để thanh toán {formatVND(amount!)} </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR" className="mx-auto" />
        <p className="mt-4 text-sm text-gray-600">Sau khi thanh toán xong hệ thống sẽ tự kích hoạt.</p>
      </div>
    );

  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Thanh toán {product.toUpperCase()}</h1>

      <p className="mb-2">
        Giá gốc: <b>{formatVND(PRICE[product as keyof typeof PRICE])}</b>
      </p>

      {/* ô nhập mã */}
      <input
        className="border p-2 w-full mb-3"
        placeholder="Mã giảm giá"
        value={code}
        onChange={e => setCode(e.target.value)}
      />

      {/* ô hiển thị số tiền cần trả */}
      <input
        className="border p-2 w-full mb-6 bg-gray-50"
        readOnly
        value={amount !== null ? formatVND(amount) : ""}
        placeholder="Số tiền thanh toán"
      />

      <button
        onClick={checkout}
        disabled={loading || amount === null}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded w-full disabled:opacity-50"
      >
        {loading ? "Đang tạo QR…" : "Đi đến quét mã Thanh toán"}
      </button>
    </div>
  );
}
