// src/app/checkout/page.tsx
"use client";
import { useState } from "react";

// ✅ formatter cố định
const VND = new Intl.NumberFormat("vi-VN");

const PRODUCTS = [
  { id: "mbti",     name: "MBTI",               price: 10_000 },
  { id: "holland",  name: "Holland",            price: 20_000 },
  { id: "knowdell", name: "Knowdell",           price: 100_000 },
  { id: "combo",    name: "Cả 3 trắc nghiệm",   price: 90_000 },
];

export default function Checkout() {
  const [selected, setSelected] = useState("mbti");
  const [coupon,   setCoupon]   = useState("");
  const [qr,       setQr]       = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const pay = async () => {
    setLoading(true);
    const res  = await fetch("/api/payments/create", {
      method: "POST",
      body  : JSON.stringify({ product: selected, coupon }),
    });
    const data = await res.json();
    setQr(data.qr);
    setLoading(false);
  };

  return (
    <section className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chọn gói thanh toán</h1>

      <ul className="space-y-3 mb-4">
        {PRODUCTS.map(p => (
          <li key={p.id} className="flex justify-between items-center border p-3 rounded">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="product"
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
              />
              {p.name}
            </label>

            {/* ✅ luôn format bằng VND.format(...) */}
            <span className="font-semibold">
              {VND.format(p.price)} ₫
            </span>
          </li>
        ))}
      </ul>

      <input
        placeholder="Mã khuyến mãi (nếu có)"
        value={coupon}
        onChange={e => setCoupon(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-4"
      />

      <button
        onClick={pay}
        disabled={loading}
        className="bg-brandYellow hover:bg-yellow-500 text-black px-6 py-3 rounded w-full"
      >
        {loading ? "Đang tạo QR…" : "Thanh toán"}
      </button>

      {qr && (
        <div className="mt-6 text-center">
          <h2 className="font-semibold mb-2">Quét QR bằng app ngân hàng</h2>
          <img src={qr} alt="QR code" className="mx-auto w-56 h-56" />
          <p className="mt-2 text-sm text-gray-500">
            Sau khi hoàn tất, trang sẽ tự cập nhật.
          </p>
        </div>
      )}
    </section>
  );
}
