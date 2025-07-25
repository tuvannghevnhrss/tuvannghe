// -----------------------------------------------------------------------------
// src/components/OptionsTab.tsx  ― <Tab 2 – Lựa chọn>
// -----------------------------------------------------------------------------
"use client";
import { useState } from "react";
import AnalysisCard from "./AnalysisCard";

type Knowdell = { values: string[]; skills: string[]; interests: string[] };

export default function OptionsTab({
  canAnalyse,
  initialJobs,
}: {
  canAnalyse  : boolean;
  initialJobs : any[];          // 5 nghề đã lưu (nếu có)
}) {
  const [loading, setLoading] = useState(false);
  const [error  , setError  ]  = useState<string | null>(null);
  const [show   , setShow   ]  = useState(initialJobs.length > 0);

  async function runAnalyse() {
    if (!canAnalyse || loading) return;
    setLoading(true); setError(null);

    const res = await fetch("/api/career/analyse", { method: "POST" });
    if (!res.ok) {
      const { error } = await res.json();
      return setError(
        error === "PROFILE_NOT_FOUND"
          ? "Chưa có dữ liệu Holland & Knowdell."
          : "Phân tích thất bại – thử lại sau.",
      );
    }
    setShow(true);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <button
        onClick={runAnalyse}
        disabled={loading || !canAnalyse}
        className="rounded bg-indigo-600 px-5 py-2 text-white disabled:opacity-40"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
      {show  && <AnalysisCard />}
    </div>
  );
}
