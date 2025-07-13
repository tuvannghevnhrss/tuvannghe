/* src/app/payment/PaymentContent.tsx
   Hỗ trợ mã giảm giá + QR inline */

"use client";

import { useEffect, useState } from "react";
import { SERVICE } from "@/lib/constants";

type Props = { product: keyof typeof SERVICE };

export default function PaymentContent({ product }: Props) {
  const [coupon, setCoupon]   = useState("");
  const [amount, setAmount]   = useState<number | null>(null);
  const [discount, setDisc]   = useState(0);
  const [qr, setQr]           = useState<string | null>(null);
  const [error, setError]     = useState("");

  /* --- Lấy giá mặc định (chưa nhập coupon) ----------------------- */
  useEffect(() => {
    fetch(`/api/payments/quote?product=${product}`)
      .then(r => r.json())
      .then(res => { setAmount(res.amount); setDisc(res.discount ?? 0); })
      .catch(() => setAmount(-1));
  }, [product]);

  /* --- Áp dụng coupon ------------------------------------------- */
  async function applyCoupon() {
    setError("");
    const code = coupon.trim();
    if (!code) return;

    const res = await fetch(
      `/api/payments/quote?product=${product}&coupon=${code}`
    ).then(r => r.json());

    if (res.error) {
      setError(res.error);
      return;
    }
    setAmount(res.amount);
    setDisc(res.discount);
  }

  /* --- Thực hiện thanh toán ------------------------------------- */
  async function checkout() {
    setError("");
    const body = { product, coupon: coupon.trim() || undefined };
    const res  = await fetch("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(r => r.json());

    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.free) location.reload();        // amount = 0
    else setQr(res.qr_url);                 // hiển thị QR
  }

  /* --- UI -------------------------------------------------------- */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Thanh toán gói {product.toUpperCase()}
      </h2>

      <p>
        Phí cần trả:{" "}
        <b>{amount.toLocaleString("vi-VN")} đ</b>
        {discount > 0 && (
          <span className="text-sm text-green-600"> (đã giảm {discount.toLocaleString("vi-VN")} đ)</span>
        )}
      </p>

      {/* ô nhập coupon */}
      <div className="space-x-2">
        <input
          value={coupon}
          onChange={e => setCoupon(e.target.value)}
          placeholder="Mã giảm giá"
          className="px-3 py-2 border rounded w-40"
        />
        <button
          onClick={applyCoupon}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Áp dụng
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* QR hoặc nút Thanh toán */}
      {qr ? (
        <img src={qr} alt="QR thanh toán" className="mx-auto w-64 h-64 border" />
      ) : (
        <button
          onClick={checkout}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          {amount === 0 ? "Xác nhận & kích hoạt" :
            `Thanh toán ${amount.toLocaleString("vi-VN")} đ`}
        </button>
      )}
    </div>
  );
}
