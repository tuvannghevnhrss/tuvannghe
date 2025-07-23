/* -------------------------------------------------------------------------
   src/components/OptionsTab.tsx          ⟵ thay thế nguyên file cũ
   ------------------------------------------------------------------------- */
"use client";

import { useState } from "react";

interface Props {
  holland     : string | null;
  knowdell    : Record<string, any>;
  canAnalyse  : boolean;
  initialJobs : string[];
}

export default function OptionsTab({
  holland,
  knowdell,
  canAnalyse,
  initialJobs,
}: Props) {
  /* ---------- state ---------- */
  const [loading, setLoading] = useState(false);
  const [jobs,    setJobs]    = useState<string[]>(initialJobs);
  const [error,   setError]   = useState<string | null>(null);

  /* ---------- handlers ---------- */
  const handleAnalyse = async () => {
    if (!canAnalyse || loading) return;
    setLoading(true); setError(null);

    try {
      /* Gọi Edge-Function AI – server sẽ:
         1) phân tích Holland & Knowdell
         2) lọc nghề thu nhập cao
         3) trả tối đa 5 gợi ý  */
      const res = await fetch("/api/career/analyse", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          holland,            // "ECR" | null
          knowdell,           // object values/skills/interests
          topN   : 5,         // chỉ cần 5 nghề
          salary : "high",    // tiêu chí thu nhập tốt
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data: { jobs: string[] } = await res.json();

      setJobs(data.jobs);
      if (data.jobs.length === 0) setError("Chưa tìm thấy gợi ý phù hợp.");
    } catch (err: any) {
      console.error(err);
      setError("Phân tích thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- render ---------- */
  if (!canAnalyse)
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center">
        <p>
          Bạn cần hoàn tất <strong>Holland</strong> &amp;{" "}
          <strong>Knowdell</strong> để sử dụng tính năng phân tích nghề nghiệp.
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <button
        onClick={handleAnalyse}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {jobs.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {jobs.map((j) => (
            <li key={j}>{j}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
