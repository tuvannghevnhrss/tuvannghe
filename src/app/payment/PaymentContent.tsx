"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import formatVND from "@/lib/formatVND";

type Props = { product: string };

export default function PaymentContent({ product }: Props) {
  /* -------------------- hằng số -------------------- */
  const PRICE = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  } as const;

  const basePrice = useMemo(() => PRICE[product as keyof typeof PRICE], [product]);

  /* -------------------- state -------------------- */
  const [coupon, setCoupon] = useState("");
  const [amount, setAmount] = useState<number>(basePrice);         // ⭐ mặc định = giá gốc
  const [qr,     setQr]     = useState<string | null>(null);
  const [order,  setOrder]  = useState<string | null>(null);       // order_id
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout>();

  /* -------------------- tính tiền khi gõ coupon -------------------- */
  useEffect(() => {
    if (!coupon.trim()) {                        // rỗng → reset về giá gốc
      setAmount(basePrice);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/payments/quote", {
          method : "POST",
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify({ product, coupon: coupon.trim() }),
        });
        const { amount: a } = await res.json();
        setAmount(a ?? basePrice);               // nếu API ko trả về thì giữ giá gốc
      } catch {
        setAmount(basePrice);
      }
    }, 400);                                     // debounce 400 ms

    return () => clearTimeout(t);
  }, [coupon, product, basePrice]);

  /* -------------------- tạo QR & ghi order -------------------- */
  const checkout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/payments/checkout", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ product, coupon: coupon.trim() }),
      });

      const { qr_url, order_id } = await res.json();
      setQr(qr_url);
      setOrder(order_id);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- polling trạng thái thanh toán -------------------- */
  useEffect(() => {
    if (!order) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${order}`);
        const { status } = await res.json();
        if (status === "paid") {
          clearInterval(pollRef.current);
          window.location.href = `/${product}?start=1`; // chuyển thẳng vào bài test
        }
      } catch {/* bỏ qua lỗi tạm thời */}
    };

    pollRef.current = setInterval(poll, 3_000); // 3 s/lần
    return () => clearInterval(pollRef.current);
  }, [order, product]);

  /* -------------------- UI -------------------- */
  if (qr)
    return (
      <div className="text-center py-10">
        <h2 className="mb-4 font-medium">
          Quét QR để thanh toán&nbsp;{formatVND(amount)}
        </h2>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR SePay" className="mx-auto max-w-xs" />

        <p className="mt-4 text-sm text-gray-600">
          Sau khi thanh&nbsp;toán xong, hệ thống sẽ tự kích hoạt.
        </p>
      </div>
    );

  return (
    <section className="mx-auto max-w-lg py-12">
      <h1 className="mb-6 text-2xl font-bold">
        Thanh toán {product.toUpperCase()}
      </h1>

      <p className="mb-2">
        Giá gốc: <b>{formatVND(basePrice)}</b>
      </p>

      <input
        className="mb-3 w-full border p-2"
        placeholder="Mã giảm giá"
        value={coupon}
        onChange={(e) => setCoupon(e.target.value)}
      />

      <input
        readOnly
        className="mb-6 w-full border bg-gray-50 p-2"
        placeholder="Số tiền thanh toán"
        value={formatVND(amount)}
      />

      <button
        onClick={checkout}
        disabled={loading}
        className="
          w-full rounded bg-blue-600 px-6 py-3 text-white transition
          hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60
        "
      >
        {loading ? "Đang tạo QR…" : "Đi đến quét mã Thanh toán"}
      </button>
    </section>
  );
}
