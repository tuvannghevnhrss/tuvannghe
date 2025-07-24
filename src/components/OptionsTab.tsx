/* ------------------------------------------------------------------------- *
   TAB 2 – LỰA CHỌN: GỌI GPT & HIỂN THỊ MARKDOWN
 * ------------------------------------------------------------------------- */
"use client";

import { useState } from "react";
import AnalysisCard from "./AnalysisCard";

interface Props {
  canAnalyse   : boolean;           // đã đủ dữ liệu Holland + Knowdell?
  hasAnalysed  : boolean;           // profile.suggested_jobs != null
}

export default function OptionsTab({ canAnalyse, hasAnalysed }: Props) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState<string|null>(null);
  const [show,    setShow]    = useState<boolean>(hasAnalysed);

  /* ----- gọi API GPT ------------------------------------------------------- */
  const runAnalyse = async () => {
    if (!canAnalyse || loading) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/career/analyse", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      /* API đã lưu kết quả vào DB → chỉ cần re-render AnalysisCard */
      setShow(true);
    } catch (e:any) {
      console.error(e);
      setErr("Phân tích thất bại – thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /* ----- UI --------------------------------------------------------------- */
  if (!canAnalyse)
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Vui lòng hoàn tất <strong>Holland</strong> &nbsp;và&nbsp;
        <strong>Knowdell</strong> để sử dụng tính năng phân tích.
      </p>
    );

  return (
    <div className="space-y-6">
      {/* nút gọi GPT */}
      <button
        onClick={runAnalyse}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {err && <p className="text-red-600">{err}</p>}

      {/* Kết quả (Markdown đã làm sạch) */}
      {show && <AnalysisCard />}
    </div>
  );
}
