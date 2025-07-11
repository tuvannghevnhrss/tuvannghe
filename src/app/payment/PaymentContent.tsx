"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import formatVND from "@/lib/formatVND";

type Props = { product: string };

export default function PaymentContent({ product }: Props) {
  const [coupon, setCoupon] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Giá gốc cho từng product
  const PRICE: Record<string, number> = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  };
  const original = PRICE[product] ?? 0;

  // khi mount, set amount = giá gốc
  useEffect(() => {
    setAmount(original);
  }, [original]);

  // submit để tạo QR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, coupon }),
    });

    if (!res.ok) {
      console.error(await res.text());
      setLoading(false);
      return;
    }
    const { qr_url, amount: amt, order_code } = await res.json();
    setAmount(amt);
    setQrUrl(qr_url);
    setOrderCode(order_code);
    setLoading(false);
  };

  // poll every 3s khi qrUrl đã có
  useEffect(() => {
    if (!qrUrl) return;
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/status?product=${product}`);
      if (res.ok) {
        const { paid } = await res.json();
        if (paid) {
          clearInterval(intervalRef.current!);
          // chuyển sang trang quiz hoặc kết quả
          router.push(`/${product}`);
        }
      }
    }, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [qrUrl, product, router]);

  return (
    <div className="max-w-lg mx-auto py-6">
      {!qrUrl ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1">Mã giảm giá</label>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Nhập mã nếu có"
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Số tiền thanh toán</label>
            <input
              type="text"
              readOnly
              value={formatVND(amount)}
              className="w-full bg-gray-100 border px-3 py-2 rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
          >
            {loading ? "Đang xử lý…" : "Đi đến quét mã Thanh toán"}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Quét QR để thanh toán {formatVND(amount)}
          </h2>
          <img src={qrUrl} alt="QR Code" className="mx-auto border p-2" />
          <p className="mt-4 text-gray-600">
            Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.
          </p>
        </div>
      )}
    </div>
  );
}
