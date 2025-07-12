"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import formatVND from "@/lib/formatVND";

type Props = { product: string };

// Nhãn hiển thị cho mỗi product
const LABELS: Record<string, string> = {
  mbti: "MBTI",
  holland: "Holland",
  knowdell: "Giá trị bản thân",
  combo: "Combo",
};

export default function PaymentContent({ product }: Props) {
  const [coupon, setCoupon] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Giá gốc
  const PRICE: Record<string, number> = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  };
  const original = PRICE[product] ?? 0;
  const label = LABELS[product] ?? product;

  // lúc mount, để số tiền = gốc
  useEffect(() => {
    setAmount(original);
  }, [original]);

  // submit form để tạo QR
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
    const { qr_url, amount: amt } = await res.json();
    setAmount(amt);
    setQrUrl(qr_url);
    setLoading(false);
  };

  // poll status 3s/lần, khi paid thì điều hướng
  useEffect(() => {
    if (!qrUrl) return;
    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/status?product=${product}`);
      if (res.ok) {
        const { paid } = await res.json();
        if (paid) {
          clearInterval(intervalRef.current!);
          router.push(`/${product}`);
        }
      }
    }, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [qrUrl, product, router]);

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Tiêu đề & giá gốc */}
      {!qrUrl && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Thanh toán {label}</h1>
          <p className="text-lg text-gray-700">
            Giá gốc: <span className="font-medium">{formatVND(original)}</span>
          </p>
        </div>
      )}

      {!qrUrl ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">Nhập mã giảm giá</label>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Nhập mã nếu có"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Số tiền thanh toán</label>
            <input
              type="text"
              readOnly
              value={formatVND(amount)}
              className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý…" : "Đi đến quét mã Thanh toán"}
          </button>
        </form>
      ) : (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Quét QR để thanh toán {formatVND(amount)}
          </h2>
          <img
            src={qrUrl!}
            alt="QR Code"
            className="mx-auto border-2 border-gray-200 rounded p-2 mb-4"
          />
          <p className="text-gray-600">
            Sau khi thanh toán xong, hệ thống sẽ tự động kích hoạt.
          </p>
        </div>
      )}
    </div>
  );
}
