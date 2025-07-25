/* ─── Client component ─── */
"use client";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AnalysisCard() {
  const { data, error } = useSWR("/api/profile/summary", (url) =>
    fetch(url).then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
  );

  if (error)
    return <p className="text-red-600">Không lấy được dữ liệu – thử F5.</p>;

  if (!data)
    return <p className="italic text-gray-500">Đang tải kết quả…</p>;

  /** safeguard: nếu markdown lỗi – hiển thị raw */
  try {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {data.knowdell_summary}
      </ReactMarkdown>
    );
  } catch (e) {
    console.error("MD render error", e);
    return (
      <pre className="whitespace-pre-wrap rounded bg-amber-50 p-4 text-sm">
        {data.knowdell_summary}
      </pre>
    );
  }
}
