"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCouponButton({ code }: { code: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(`Xoá mã "${code}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/coupons/${encodeURIComponent(code)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "..." : "Xoá"}
    </button>
  );
}
