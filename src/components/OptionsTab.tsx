/* -------------------------------------------------------------------------
   src/components/OptionsTab.tsx  –  dùng thay thế hoàn toàn file cũ
   ------------------------------------------------------------------------- */
"use client";

import { useState } from "react";

interface CareerRating {
  career: string;
  fitLevel: string;
  reason: string;
}

interface AnalyseDetails {
  summary?: string;
  careerRatings?: CareerRating[];
}

interface Props {
  holland      : string | null;
  knowdell     : {
    values: string[];
    skills: string[];
    interests: string[];
  };
  canAnalyse   : boolean;
  /* dữ liệu lưu sẵn trong supabase (cột suggested_jobs) */
  initialJobs?    : string[];
  /* nếu bạn đã từng lưu cả phần phân tích chi tiết */
  initialDetails? : AnalyseDetails | null;
}

export default function OptionsTab({
  holland,
  knowdell,
  canAnalyse,
  initialJobs     = [],
  initialDetails  = null,
}: Props) {
  /* ---------- state ---------- */
  const [loading, setLoading]   = useState(false);
  const [jobs,    setJobs]      = useState<string[]>(initialJobs);
  const [details, setDetails]   = useState<AnalyseDetails | null>(initialDetails);
  const [error,   setError]     = useState<string | null>(null);

  /* ---------- handler ---------- */
  const handleAnalyse = async () => {
    if (!canAnalyse || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career/analyse", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          holland,
          knowdell,
          topN  : 5,
          salary: "high",
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      /* API trả về { jobs, analysis } */
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setDetails(data.analysis ?? null);

      if (!data.jobs?.length) {
        setError("Chưa tìm thấy gợi ý phù hợp.");
      }
    } catch (err) {
      console.error(err);
      setError("Phân tích thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- render ---------- */
  if (!canAnalyse) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center">
        <p>
          Bạn cần hoàn tất <strong>Holland</strong> &nbsp;và&nbsp;
          <strong>Knowdell</strong> để sử dụng tính năng phân tích nghề nghiệp.
        </p>
      </div>
    );
  }

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

      {/* ── Danh sách nghề gợi ý ─────────────────────────────── */}
      {jobs.length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-sm">
          {jobs.map((j) => (
            <li key={j}>{j}</li>
          ))}
        </ul>
      )}

      {/* ── Phần phân tích chi tiết (nếu API trả về) ─────────── */}
      {details?.summary && (
        <div className="space-y-2 border-t pt-4">
          <p className="font-semibold">Tóm tắt</p>
          <p className="text-sm leading-relaxed">{details.summary}</p>
        </div>
      )}

      {details?.careerRatings?.length ? (
        <div className="space-y-2">
          <p className="font-semibold">Đánh giá chi tiết</p>
          <ul className="space-y-1 text-sm">
            {details.careerRatings.map((r, idx) => (
              <li key={idx}>
                <strong>{r.career}</strong> – {r.fitLevel} ({r.reason})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
