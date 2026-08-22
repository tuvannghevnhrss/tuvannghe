"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkPaidButton({ paymentId }: { paymentId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm("Xác nhận đã nhận được tiền cho giao dịch này?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/mark-paid`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Thao tác thất bại");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
    >
      {loading ? "Đang xử lý..." : "Xác nhận đã nhận tiền"}
    </button>
  );
}
