/* src/app/payment/PaymentContent.tsx
   – Hiển thị giá / mã giảm / QR
   – Poll 3 giây khi đã phát QR để tự reload khi PAID       */

"use client";

import { useEffect, useState } from "react";
import { SERVICE } from "@/lib/constants";

type Props = { product: keyof typeof SERVICE };

type QuoteRes =
  | { error: string }
  | { listPrice: number; amount_due: number; discount: number; amount: number };

export default function PaymentContent({ product }: Props) {
  /* ------------- state ------------- */
  const [coupon, setCoupon]   = useState("");
  const [amount, setAmount]   = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr, setQr]           = useState<string | null>(null);
  const [error, setErr]       = useState("");

  /* 1 ▸ lấy giá mặc định */
  useEffect(() => {
    fetch(`/api/payments/quote?product=${product}`)
      .then(r => r.json() as Promise<QuoteRes>)
      .then(res => {
        if ("error" in res) throw new Error(res.error);
        setAmount(res.amount);
        setDisc(res.discount);
      })
      .catch(() => setAmount(-1));
  }, [product]);

  /* 2 ▸ polling 3 s nếu đã phát QR */
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      fetch(`/api/payments/status?product=${product}`)
        .then(r => r.json())
        .then(res => {
          if (res.paid) {
            clearInterval(id);
            location.reload();
          }
        });
    }, 3000);
    return () => clearInterval(id);
  }, [qr, product]);

  /* 3 ▸ áp mã giảm */
  async function applyCoupon() {
    setErr("");
    const code = coupon.trim();
    if (!code) return;

    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}`
    ).then(r => r.json() as Promise<QuoteRes>);

    if ("error" in res) {
      setErr(res.error);
      return;
    }
    setAmount(res.amount);
    setDisc(res.discount);
  }

  /* 4 ▸ thanh toán / kích hoạt */
  async function checkout() {
    setErr("");
    const body = { product, coupon: coupon.trim() || undefined };
    const res  = await fetch("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(r => r.json());

    if (res.error) {
      setErr(res.error);
      return;
    }
    if (res.free) location.reload();    // 0 đ ⇒ kích hoạt ngay
    else setQr(res.qr_url);             // hiển thị QR
  }

  /* ------------ render ------------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Thanh toán gói {product.toUpperCase()}
      </h2>

      <p>
        Phí cần trả: <b>{amount.toLocaleString("vi-VN")} đ</b>
        {discount > 0 && (
          <span className="text-sm text-green-600"> (đã giảm {discount.toLocaleString("vi-VN")} đ)</span>
        )}
      </p>

      {/* ô coupon */}
      <div className="space-x-2">
        <input
          value={coupon}
          onChange={e => setCoupon(e.target.value)}
          placeholder="Mã giảm giá"
          className="px-3 py-2 border rounded w-40"
        />
        <button onClick={applyCoupon} className="px-4 py-2 bg-gray-200 rounded">
          Áp dụng
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* QR hoặc nút checkout */}
      {qr ? (
        <img src={qr} alt="QR thanh toán" className="mx-auto w-64 h-64 border" />
      ) : (
        <button
          onClick={checkout}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          {amount === 0
            ? "Xác nhận & kích hoạt"
            : `Thanh toán ${amount.toLocaleString("vi-VN")} đ`}
        </button>
      )}
    </div>
  );
}
