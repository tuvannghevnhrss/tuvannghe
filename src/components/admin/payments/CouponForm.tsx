"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [product, setProduct] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount: Number(discount),
          product: product || null,
          expiresAt: expiresAt || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");
      setCode("");
      setDiscount("");
      setProduct("");
      setExpiresAt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-slate-600">Mã</span>
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm uppercase"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-slate-600">Giảm (đ)</span>
        <input
          required
          type="number"
          min={0}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-slate-600">Sản phẩm (để trống = mọi SP)</span>
        <input value={product} onChange={(e) => setProduct(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-slate-600">Hết hạn</span>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Thêm / cập nhật"}
      </button>
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}
