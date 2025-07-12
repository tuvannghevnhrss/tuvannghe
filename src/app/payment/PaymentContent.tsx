// src/app/payment/PaymentContent.tsx
"use client";
import { useEffect, useState } from "react";
import formatVND from "@/lib/formatVND";

type Props = { product: "mbti" | "holland" | "knowdell" | "combo" };

export default function PaymentContent({ product }: Props) {
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;

  const [coupon, setCoupon] = useState("");
  const [amount, setAmount] = useState<number>(PRICE[product]);

  /* 💡 tính tiền mỗi khi mã giảm giá đổi */
  useEffect(() => {
    if (!coupon) {
      setAmount(PRICE[product]);
      return;
    }

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/payments/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, code: coupon.trim() }),
          signal: ctrl.signal,
        });
        if (res.ok) {
          const { amount: newAmount } = await res.json();
          setAmount(newAmount);
        } else {
          /* mã không hợp lệ → giữ giá gốc */
          setAmount(PRICE[product]);
        }
      } catch (_) {}
    })();
    return () => ctrl.abort();
  }, [coupon, product]);

  /* … UI */
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Thanh toán {product === "mbti" ? "MBTI" : "Holland"}</h1>

      <p className="font-medium">
        Giá gốc: <span className="font-bold">{formatVND(PRICE[product])}</span>
      </p>

      <label className="block space-y-2">
        <span className="font-medium">Nhập mã giảm giá</span>
        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          placeholder="Nhập mã nếu có"
          className="w-full border rounded px-4 py-2"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-medium">Số tiền thanh toán</span>
        <input
          readOnly
          value={formatVND(amount)}
          className="w-full border rounded px-4 py-2 bg-gray-100 cursor-not-allowed"
        />
      </label>

      {/* nút tạo QR */}
      <button
        onClick={async () => {
          const res = await fetch("/api/payments/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product, coupon }),
          });
          if (res.ok) {
            const { qr_url } = await res.json();
            window.location.href = qr_url; // hoặc mở modal QR
          } else {
            alert("Đã có lỗi, vui lòng thử lại!");
          }
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-3 font-semibold"
      >
        Đi đến quét mã Thanh toán
      </button>
    </div>
  );
}
