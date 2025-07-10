"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const PRICES = { mbti: 10000, holland: 20000, knowdell: 100000, combo: 90000 };

export default function PaymentPage() {
  const params = useSearchParams();
  const product = params.get("product") ?? "mbti";
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const checkout = async () => {
    const res = await fetch("/api/payment/checkout", {
      method: "POST",
      body: JSON.stringify({ product, coupon: code }),
    }).then(r => r.json());
    setQr(res.qr_url);
    setAmount(res.amount);
  };

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Thanh toán {product.toUpperCase()}</h1>
      {!qr ? (
        <>
          <p className="mb-4">Giá gốc: {PRICES[product as keyof typeof PRICES].toLocaleString()} ₫</p>
          <input
            className="border p-2 w-full mb-4"
            placeholder="Mã giảm giá"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button onClick={checkout} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded">
            Tạo mã QR
          </button>
        </>
      ) : (
        <div className="text-center">
          <p className="mb-4">Quét QR để thanh toán {amount?.toLocaleString()} ₫</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code" className="mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.</p>
        </div>
      )}
    </div>
  );
}
