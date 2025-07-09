"use client";

import { useState } from "react";
import AnalysisCard  from "./AnalysisCard";

/* Kiểu dữ liệu 1 nghề */
interface Job {
  id: string;
  title: string;
  avg_salary?: number;
  growth_path?: string;
  score?: number;
  reason?: string;
}

export default function OptionsTab({
  mbti,
  holland,
  knowdell,
  initialJobs,
}: {
  mbti?: string;
  holland?: string;
  knowdell: any;
  initialJobs: Job[];
}) {
  const [jobs, setJobs]       = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string>();

  /* Gọi API lấy TOP-5 nghề */
  const getJobs = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/career", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          mbti,
          holland,
          values    : knowdell?.values    ?? [],
          skills    : knowdell?.skills    ?? [],
          interests : knowdell?.interests ?? [],
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Server error");
      }
      setJobs((await res.json()) as Job[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* UI */
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 sm:px-6 md:px-8">
      {/* 1. Phân tích 20 nghề Knowdell */}
      <AnalysisCard />

      {/* 2. TOP-5 nghề gợi ý */}
      {!jobs?.length ? (
        <div className="space-y-6">
          <p className="text-gray-600">
            Nhấn nút dưới đây để AI gợi ý 5 nghề phù hợp nhất với bạn.
          </p>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={getJobs}
            disabled={loading}
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
          >
            {loading ? "Đang phân tích..." : "Gợi ý nghề nghiệp"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">TOP 5 nghề phù hợp</h2>
          <ul className="space-y-4">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-1"
              >
                <p className="font-medium">{j.title}</p>

                {j.avg_salary && (
                  <p className="text-sm text-gray-600">
                    Lương TB: {j.avg_salary.toLocaleString()}₫ / tháng
                  </p>
                )}

                {j.growth_path && (
                  <p className="text-sm italic">{j.growth_path}</p>
                )}

                {j.reason && (
                  <p className="text-xs text-indigo-600 mt-1">{j.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
