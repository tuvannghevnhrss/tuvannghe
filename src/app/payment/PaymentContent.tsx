/* src/app/payment/PaymentContent.tsx
   Rút gọn: fetch <> useEffect  —   KHÔNG dùng swr */

"use client";

import { useEffect, useState } from "react";
import { SERVICE } from "@/lib/constants";

type Props = { product: keyof typeof SERVICE };

export default function PaymentContent({ product }: Props) {
  const [amount, setAmount] = useState<number | null>(null);

  /* 1. Gọi API quote duy nhất một lần */
  useEffect(() => {
    fetch(`/api/payments/quote?product=${product}`)
      .then(r => r.json())
      .then(res => setAmount(res.amount))
      .catch(() => setAmount(-1));                // lỗi
  }, [product]);

  /* 2. Loading / lỗi */
  if (amount === null) return <p>Đang tải…</p>;
  if (amount === -1)   return <p className="text-red-600">Không lấy được giá.</p>;

  /* 3. Render */
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Thanh toán gói {product.toUpperCase()}
      </h2>
      <p>
        Phí cần trả:{" "}
        <b>{amount.toLocaleString("vi-VN")} đ</b>
      </p>

      {amount === 0 ? (
        /* —— ĐÃ thanh toán đủ trước đó —— */
        <button
          onClick={() =>
            fetch("/api/payments/checkout", {
              method: "POST",
              body: JSON.stringify({ product }),
            }).then(() => location.reload())
          }
          className="px-6 py-3 bg-green-600 text-white rounded"
        >
          Xác nhận & kích hoạt
        </button>
      ) : (
        /* —— Cần thanh toán —— */
        <button
          onClick={() =>
            fetch("/api/payments/checkout", {
              method: "POST",
              body: JSON.stringify({ product }),
            })
              .then(r => r.json())
              .then(({ qr_url }) => setQr(qr_url))
          }
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          Thanh toán {amount.toLocaleString("vi-VN")} đ
        </button>
      )}
    </div>
  );
}
