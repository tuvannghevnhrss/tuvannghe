"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50">
      {loading ? "..." : "Đánh dấu đã đọc"}
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
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
      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
    </button>
  );
}
