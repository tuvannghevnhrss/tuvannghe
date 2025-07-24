"use client";
import { useState } from "react";

/* … props giữ nguyên … */
interface ApiResp {
  jobs          : string[];
  summary       : string;
  careerRatings : { career:string; fitLevel:string; reason:string }[];
  topCareers    : {
    career:string;
    salaryMedian:number;
    roadmap:{ stage:string; skills:string }[];
  }[];
}

export default function OptionsTab(/* props … */) {
  /* ---------- state ---------- */
  const [loading, setLoading]   = useState(false);
  const [resp,    setResp]      = useState<Partial<ApiResp>>({});
  const [error,   setError]     = useState<string|null>(null);

  const handleAnalyse = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/career/analyse", { method:"POST" });
      if (!r.ok) throw new Error(await r.text());
      const data:ApiResp = await r.json();
      setResp(data);
    } catch (e:any) {
      console.error(e);
      setError("Phân tích thất bại – thử lại sau.");
    } finally { setLoading(false); }
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-5">
      <button
        onClick={handleAnalyse}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50">
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {/* 5 nghề gợi ý */}
      {resp.jobs?.length && (
        <ul className="list-disc list-inside space-y-1">
          {resp.jobs.map(j => <li key={j}>{j}</li>)}
        </ul>
      )}

      {/* TÓM TẮT */}
      {resp.summary && (
        <div className="p-4 bg-gray-50 rounded border">
          <h4 className="font-semibold mb-1">Tóm tắt tính cách</h4>
          <p className="text-sm leading-relaxed">{resp.summary}</p>
        </div>
      )}

      {/* BẢNG ĐÁNH GIÁ */}
      {resp.careerRatings?.length && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr>
              <th className="px-2 py-1 text-left">Nghề</th>
              <th className="px-2 py-1 text-left">Phù hợp</th>
              <th className="px-2 py-1 text-left">Lý do</th>
            </tr></thead>
            <tbody>
              {resp.careerRatings.map(r => (
                <tr key={r.career}>
                  <td className="px-2 py-1">{r.career}</td>
                  <td className="px-2 py-1">{r.fitLevel}</td>
                  <td className="px-2 py-1">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ROADMAP TOP-5 */}
      {resp.topCareers?.length && (
        <div className="space-y-4">
          {resp.topCareers.map(tc => (
            <div key={tc.career} className="border rounded p-4">
              <h4 className="font-semibold">{tc.career}</h4>
              <p className="text-sm mb-2">Lương khởi điểm ~ {tc.salaryMedian.toLocaleString()} ₫/tháng</p>
              <ul className="list-disc list-inside text-xs">
                {tc.roadmap.map(rm => (
                  <li key={rm.stage}><b>{rm.stage}</b>: {rm.skills}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
