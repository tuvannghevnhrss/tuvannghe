"use client";

import { useState } from "react";

/** Hàm bóc dữ liệu gợi ý nghề từ response bất kỳ */
function pickJobs(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload))        return payload;              // API -> []
  if (Array.isArray(payload.jobs))   return payload.jobs;         // { jobs: [] }
  if (Array.isArray(payload.data))   return payload.data;         // { data: [] }
  if (Array.isArray(payload?.data?.jobs)) return payload.data.jobs;
  return [];
}

export default function OptionsTab({
  holland,
  knowdell,
  initialJobs,
  canAnalyse,
}: {
  holland    : string | null;
  knowdell   : any;           // full object (kể cả interests / skills)
  initialJobs: any[];
  canAnalyse : boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [jobs,    setJobs]    = useState(initialJobs);
  const [error,   setError]   = useState<string | null>(null);

  const analyse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/career/analyse", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const next = pickJobs(data);
      setJobs(next);
      if (next.length === 0) setError("Chưa tìm thấy gợi ý phù hợp.");
    } catch (e:any) {
      console.error(e);
      setError("Có lỗi khi phân tích – thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /* tiện ích hiển thị ---------------------------------------------------- */
  const Missing = ({ label }: { label: string }) => (
    <li>
      Hoàn thành&nbsp;
      <span className="font-medium text-indigo-600">{label}</span>
      &nbsp;và thanh toán
    </li>
  );

  return (
    <div className="space-y-6">
      {/* nút hoặc thông báo chưa đủ dữ liệu */}
      {canAnalyse ? (
        <button
          onClick={analyse}
          disabled={loading}
          className="rounded bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
        </button>
      ) : (
        <div className="rounded border border-yellow-400 bg-yellow-50 p-4 text-sm leading-relaxed">
          <p className="font-medium">Bạn chưa hoàn tất các đánh giá cần thiết:</p>
          <ul className="ml-5 list-disc space-y-1">
            {!holland  && <Missing label="Holland" />}
            {!knowdell && <Missing label="Knowdell" />}
          </ul>
          <p className="mt-2">
            Khi đã có&nbsp;
            <b>Holland</b>&nbsp;và&nbsp;<b>Knowdell</b>, nhấn
            &nbsp;<em>“Phân tích kết hợp”</em>&nbsp;để nhận gợi&nbsp;ý nghề nghiệp.
          </p>
        </div>
      )}

      {/* thông báo lỗi nếu có */}
      {error && <p className="text-red-600">{error}</p>}

      {/* danh sách gợi ý nghề */}
      {jobs.length > 0 && (
        <ul className="space-y-3">
          {jobs.map((j: any) => (
            <li
              key={j.id ?? j.title}
              className="rounded border bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold">{j.title}</h3>
              {j.snippet && (
                <p className="mt-1 text-sm text-gray-600">{j.snippet}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
