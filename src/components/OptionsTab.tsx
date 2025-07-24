/* ------------------------------------------------------------------------- *
   src/components/OptionsTab.tsx
 * ------------------------------------------------------------------------- */
"use client";

import { useState } from "react";

type TopCareer = {
  career       : string;
  salaryMedian : number;
  roadmap      : { stage: string; skills: string }[];
};

type GPTResult = {
  summary       : string;
  careerRatings : { career: string; fitLevel: string; reason: string }[];
  topCareers    : TopCareer[];
};

interface Props {
  canAnalyse  : boolean;
  initialData : GPTResult | null;          // lấy từ profile.suggested_jobs
}

export default function OptionsTab({ canAnalyse, initialData }: Props) {
  /* ---------- state ---------- */
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [data,    setData]      = useState<GPTResult | null>(initialData);

  /* ---------- handlers ---------- */
  const runAnalyse = async () => {
    if (!canAnalyse || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career/analyse", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const json: GPTResult = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setError("Phân tích thất bại – thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- render helper ---------- */
  const Top5Table = ({ list }: { list: TopCareer[] }) => (
    <table className="mt-4 w-full text-sm border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">#</th>
          <th className="p-2 text-left">Nghề</th>
          <th className="p-2 text-right">Lương (triệu)</th>
          <th className="p-2">Roadmap</th>
        </tr>
      </thead>
      <tbody>
        {list.map((c, i) => (
          <tr key={c.career} className="border-t">
            <td className="p-2">{i + 1}</td>
            <td className="p-2">{c.career}</td>
            <td className="p-2 text-right">
              {Math.round(c.salaryMedian / 1_000_000)}
            </td>
            <td className="p-2 whitespace-pre-line">
              {c.roadmap.map(r => `${r.stage}: ${r.skills}`).join("\n")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  /* ---------- UI ---------- */
  if (!canAnalyse) {
    return (
      <p className="rounded border bg-yellow-50 p-4 text-center">
        Vui lòng hoàn tất <strong>Holland</strong> &amp;{" "}
        <strong>Knowdell</strong> để sử dụng tính năng phân tích nghề nghiệp.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={runAnalyse}
        disabled={loading}
        className="rounded bg-indigo-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Đang phân tích…" : "Phân tích kết hợp"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <>
          {/* 1. Summary */}
          <p className="rounded bg-gray-50 p-4 leading-relaxed">{data.summary}</p>

          {/* 2. TOP-5 table */}
          <Top5Table list={data.topCareers.slice(0, 5)} />
        </>
      )}
    </div>
  );
}
