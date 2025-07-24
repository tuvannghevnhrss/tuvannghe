/* -------------------------------------------------------------------------
   Tab 2 – Lựa chọn: hiển thị / gọi phân tích nghề
   ------------------------------------------------------------------------- */
"use client";
import { useState } from "react";

interface Props {
  holland    : string | null;                      // “ERS”, “RIC” … – đã tính sẵn ở SSR
  knowdell   : { values:any[]; skills:any[]; interests:any[] };
  canAnalyse : boolean;                            // true khi user đã trả phí + có dữ liệu
  initialJobs: string[];                           // suggested_jobs lưu trong DB (có sẵn/ rỗng)
}

export default function OptionsTab({
  holland, knowdell, canAnalyse, initialJobs
}: Props) {

  /* -------- state -------- */
  const [jobs,    setJobs]    = useState<string[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  /* -------- handlers -------- */
  const analyse = async () => {
    if (!canAnalyse || loading) return;
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/career/analyse", {
        method : "POST",
        headers: { "Content-Type":"application/json" },
        body   : JSON.stringify({ holland, knowdell, topN:5 })
      });

      if (!res.ok) throw new Error(await res.text());
      const { jobs: list } = await res.json();      // ← API trả { jobs:[…] }

      setJobs(list);
      if (list.length === 0) setError("Chưa tìm thấy gợi ý phù hợp.");
    } catch (e:any) {
      console.error(e);
      setError(e?.message ?? "Phân tích thất bại – thử lại sau.");
    } finally{ setLoading(false); }
  };

  /* -------- UI -------- */
  if (!canAnalyse)
    return (
      <p className="rounded border border-yellow-300 bg-yellow-50 p-4 text-center">
        Cần hoàn tất <strong>Holland</strong> &amp; <strong>Knowdell</strong> để phân tích.
      </p>
    );

  return (
    <div className="space-y-4">
      <button
        onClick={analyse} disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {jobs.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {jobs.map(j => <li key={j}>{j}</li>)}
        </ul>
      )}
    </div>
  );
}
