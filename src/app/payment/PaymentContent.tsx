"use client";
import { useEffect, useRef, useState } from "react";
import formatVND from "@/lib/formatVND";

type Props = { product: string };

export default function PaymentContent({ product }: Props) {
  /* -------------------- state -------------------- */
  const [coupon, setCoupon]       = useState("");
  const [amount, setAmount]       = useState<number | null>(null);
  const [qr,     setQr]           = useState<string | null>(null);
  const [order,  setOrder]        = useState<string | null>(null); // order_id
  const [loading,setLoading]      = useState(false);
  const pollRef = useRef<NodeJS.Timeout>();

  /* -------------------- quote tiền -------------------- */
  useEffect(() => {
    if (!coupon.trim()) { setAmount(null); return; }

    const t = setTimeout(async () => {
      const r  = await fetch("/api/payments/quote", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ product, coupon: coupon.trim() }),
      });
      const { amount: a } = await r.json();
      setAmount(a ?? null);
    }, 400);                  // debounce 400 ms

    return () => clearTimeout(t);
  }, [coupon, product]);

  /* -------------------- tạo QR -------------------- */
  const checkout = async () => {
    if (amount === null) return;
    setLoading(true);

    const r = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: coupon.trim() }),
    });
    const { qr_url, order_id } = await r.json();
    setQr(qr_url);
    setOrder(order_id);
    setLoading(false);
  };

  /* -------------------- polling trạng thái -------------------- */
  useEffect(() => {
    if (!order) return;
    const poll = async () => {
      const r = await fetch(`/api/payments/status?id=${order}`);
      const { status } = await r.json();
      if (status === "paid") {
        clearInterval(pollRef.current);
        // 👉 Chuyển trang hoặc hiển thị thông báo:
        alert("Thanh toán thành công! Bạn sẽ được chuyển tới bài test.");
        window.location.href = `/${product}`;   // ví dụ: /mbti
      }
    };
    pollRef.current = setInterval(poll, 3000);    // 3 s / lần
    return () => clearInterval(pollRef.current);
  }, [order, product]);

  /* -------------------- UI -------------------- */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };

  if (qr)
    return (
      <div className="text-center">
        <h2 className="mb-4">
          Quét QR để thanh toán {formatVND(amount ?? PRICE[product as keyof typeof PRICE])}
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR" className="mx-auto max-w-xs" />
        <p className="mt-4 text-sm text-gray-600">
          Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.
        </p>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Thanh toán {product.toUpperCase()}</h1>

      <p className="mb-2">
        Giá gốc: <b>{formatVND(PRICE[product as keyof typeof PRICE])}</b>
      </p>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Mã giảm giá"
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
      />

      <input
        readOnly
        className="border p-2 w-full mb-6 bg-gray-50"
        placeholder="Số tiền thanh toán"
        value={amount !== null ? formatVND(amount) : ""}
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
