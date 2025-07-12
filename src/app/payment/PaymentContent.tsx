"use client";
import { useState } from "react";
import Image from "next/image";
import formatVND from "@/lib/formatVND";

type Props = { product: "mbti" | "holland" | "knowdell" | "combo" };

export default function PaymentContent({ product }: Props) {
  const PRICES: Record<Props["product"], number> = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  };

  /* ----- state ----- */
  const [coupon, setCoupon] = useState("");
  const [amount, setAmount] = useState(PRICES[product]);
  const [qr, setQr]       = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ----- apply coupon (khi blur hoặc Enter) ----- */
  const apply = async () => {
    if (!coupon.trim()) {                       // không nhập -> giữ giá gốc
      setAmount(PRICES[product]);
      return;
    }
    const res = await fetch("/api/payments/quote", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: coupon.trim() }),
    });
    if (!res.ok) {
      alert("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      setCoupon("");
      setAmount(PRICES[product]);
      return;
    }
    const { amount: newAmount } = await res.json();
    setAmount(newAmount);
  };

  /* ----- tạo QR ----- */
  const pay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/checkout", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ product, coupon: coupon.trim() || null }),
    });

    if (!res.ok) {
      console.error(await res.text());
      alert("Có lỗi trong quá trình tạo QR, vui lòng thử lại");
      setLoading(false);
      return;
    }

    const { qr_url, amount: amountPaid } = await res.json();
    setAmount(amountPaid);     // phòng trường hợp số tiền thay đổi do coupon
    setQr(qr_url);             // LƯU Ý: KHÔNG redirect, chỉ set vào state
    setLoading(false);
  };

  /* ----- render ----- */
  if (qr) {
    /*  Đã tạo thành công -> hiển thị ảnh QR  */
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Quét QR để thanh toán {formatVND(amount)}</h1>
        <Image src={qr} alt="QR SePay" width={300} height={300} className="mx-auto" />
        <p className="mt-6 text-gray-600">Sau khi thanh toán xong, hệ thống sẽ tự kích hoạt.</p>
      </div>
    );
  }

  /*  Form nhập coupon  */
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Thanh toán {product[0].toUpperCase() + product.slice(1)}</h1>

      <p className="font-semibold mb-6">
        Giá gốc: {formatVND(PRICES[product])}
      </p>

      <label className="block mb-2 font-medium">Nhập mã giảm giá</label>
      <input
        value={coupon}
        onChange={e => setCoupon(e.target.value.toUpperCase())}
        onBlur={apply}
        onKeyDown={e => e.key === "Enter" && apply()}
        className="w-full border rounded px-4 py-2 mb-6"
        placeholder="Nhập mã nếu có"
      />

      <label className="block mb-2 font-medium">Số tiền thanh toán</label>
      <input
        value={formatVND(amount)}
        readOnly
        className="w-full border rounded px-4 py-2 mb-6 bg-gray-50 text-gray-700"
      />

      <button
        onClick={pay}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded transition disabled:opacity-60"
      >
        {loading ? "Đang tạo QR…" : "Đi đến quét mã Thanh toán"}
      </button>
    </div>
  );
}
