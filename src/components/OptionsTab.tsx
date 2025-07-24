/* ------------------------------------------------------------------------- *
   TAB 2 – LỰA CHỌN: GỌI GPT & HIỂN THỊ KẾT QUẢ
 * ------------------------------------------------------------------------- */
"use client";

import { useState } from "react";
import AnalysisCard from "./AnalysisCard";

interface Props {
  /** Đã có đủ Holland + Knowdell để cho phép phân tích hay chưa */
  canAnalyse  : boolean;
  /** Server đã tính & lưu gợi ý nghề (để hiển thị ngay) */
  hasAnalysed : boolean;
}

export default function OptionsTab({ canAnalyse, hasAnalysed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [show,    setShow]    = useState<boolean>(hasAnalysed);

  /* --------------------------------------------------------------------- *
     Gọi API /api/career/analyse     (không gửi body)
   * --------------------------------------------------------------------- */
  async function handleAnalyse() {
    if (!canAnalyse || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career/analyse", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());

      /* API đã lưu kết quả vào DB, chỉ cần hiển thị */
      setShow(true);
    } catch (e) {
      console.error(e);
      setError("Phân tích thất bại – thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------------------------------------------- *
     UI
   * --------------------------------------------------------------------- */
  if (!canAnalyse) {
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Vui lòng hoàn tất <strong>Holland</strong> và&nbsp;
        <strong>Knowdell</strong> để sử dụng tính năng phân tích.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* nút gọi GPT */}
      <button
        onClick={handleAnalyse}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {/* kết quả */}
      {show && <AnalysisCard />}
    </div>
  );
}
