"use client";

import { useState } from "react";

export default function OptionsTab({
  mbti,
  holland,
  knowdell,
  initialJobs,
  canAnalyse,
}: {
  mbti: string | null;
  holland: string | null;
  knowdell: any;
  initialJobs: any[];
  canAnalyse: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs]       = useState(initialJobs);

  const analyse = async () => {
    setLoading(true);
    const res = await fetch("/api/career/analyse", { method: "POST" });
    const data = await res.json();
    setJobs(data.jobs);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* nút hoặc khung hướng dẫn */}
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
          <p className="font-medium">Bạn chưa hoàn tất các đánh giá cần thiết.</p>
          <ul className="ml-4 list-disc">
            {!mbti && <li>Hoàn thành & thanh toán MBTI</li>}
            {!holland && <li>Hoàn thành & thanh toán Holland</li>}
            {!knowdell && <li>Hoàn thành & thanh toán Knowdell</li>}
          </ul>
          <p className="mt-2">
            Sau khi mua đủ 3 gói, bạn có thể nhấn <b>Phân tích kết hợp</b> để
            nhận gợi ý nghề nghiệp phù hợp.
          </p>
        </div>
      )}

      {/* bảng / danh sách jobs gợi ý */}
      {jobs.length > 0 && (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded border bg-white p-4 shadow-sm">
              <h3 className="font-semibold">{j.title}</h3>
              <p className="text-sm text-gray-600">{j.snippet}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
