/* src/app/payment/PaymentContent.tsx
   – Hiển thị giá / mã giảm / QR
   – Poll 3 giây khi đã phát QR để tự reload khi PAID
   – Cố ý “no-store” để F5 không giữ JSON cũ
   – Khung được căn giữa bằng mx-auto + max-w-sm + text-center
---------------------------------------------------------------- */

"use client";

import { useEffect, useState } from "react";
import { SERVICE } from "@/lib/constants";

type Props = { product: keyof typeof SERVICE };

type Quote =
  | { error: string }
  | { listPrice: number; amount_due: number; discount: number; amount: number };

export default function PaymentContent({ product }: Props) {
  /* ---------- state ---------- */
  const [coupon , setCoupon] = useState("");
  const [amount , setAmount] = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr     , setQr]      = useState<string | null>(null);
  const [error  , setErr]     = useState("");

  /* 1 ▸ giá mặc định */
  useEffect(() => {
    fetch(`/api/payments/quote?product=${product}&ts=${Date.now()}`, {
      cache: "no-store",
    })
      .then(r => r.json() as Promise<Quote>)
      .then(res => {
        if ("error" in res) throw new Error(res.error);
        setAmount(res.amount);
        setDisc(res.discount);
      })
      .catch(() => setAmount(-1));
  }, [product]);

  /* 2 ▸ polling 3s nếu đã có QR */
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      fetch(`/api/payments/status?product=${product}`, { cache: "no-store" })
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

  /* 3 ▸ áp mã */
  async function applyCoupon() {
    setErr("");
    const code = coupon.trim();
    if (!code) return;

    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}&ts=${Date.now()}`,
      { cache: "no-store" }
    ).then(r => r.json() as Promise<Quote>);

    if ("error" in res) { setErr(res.error); return; }
    setAmount(res.amount);
    setDisc  (res.discount);
  }

  /* 4 ▸ thanh toán / kích hoạt */
  async function checkout() {
    setErr("");
    const body = { product, coupon: coupon.trim() || undefined };
    const res  = await fetch("/api/payments/checkout", {
      method: "POST",
      body  : JSON.stringify(body),
      cache : "no-store",
    }).then(r => r.json());

    if (res.error) { setErr(res.error); return; }
    if (res.free)  location.reload();
    else           setQr(res.qr_url);
  }

  /* ---------- render ---------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  return (
    <div className="mx-auto max-w-sm space-y-6 text-center">
      <h2 className="text-xl font-semibold">
        Thanh&nbsp;toán gói {product.toUpperCase()}
      </h2>

      <p>
        Phí cần trả:&nbsp;
        <b>{amount.toLocaleString("vi-VN")} đ</b>
        {discount > 0 && (
          <span className="text-sm text-green-600">
            {" "} (đã giảm {discount.toLocaleString("vi-VN")} đ)
          </span>
        )}
      </p>

      {/* ô coupon */}
      <div className="flex justify-center gap-2">
        <input
          value={coupon}
          onChange={e => setCoupon(e.target.value)}
          placeholder="Mã giảm giá"
          className="w-36 rounded border px-3 py-2 text-center"
        />
        <button
          onClick={applyCoupon}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Áp dụng
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* QR hoặc nút checkout */}
      {qr ? (
        <img
          src={qr}
          alt="QR thanh toán"
          className="mx-auto h-64 w-64 rounded border"
        />
      ) : (
        <button
          onClick={checkout}
          className="w-full rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          {amount === 0
            ? "Xác nhận & kích hoạt"
            : `Thanh toán ${amount.toLocaleString("vi-VN")} đ`}
        </button>
      )}
    </div>
  );
}
