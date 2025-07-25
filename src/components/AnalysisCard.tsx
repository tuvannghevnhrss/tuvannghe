"use client";

import useSWR         from "swr";
import ReactMarkdown  from "react-markdown";
import remarkGfm      from "remark-gfm";

const fetcher = (u: string) => fetch(u).then(r => {
  if (!r.ok) throw new Error("API");   // 4xx/5xx => SWR sẽ retry
  return r.json();
});

export default function AnalysisCard() {
  const { data, error, isLoading } = useSWR(
    "/api/career/analyse",
    fetcher,
    {
      refreshInterval: data?.knowdell_summary ? 0 : 5000,
      revalidateOnFocus: false,
    },
  );

  /* ---------- trạng thái ---------- */
  if (isLoading)
    return <p className="italic text-gray-500">Đang phân tích…</p>;

  if (error)
    return <p className="text-red-600">Lỗi tải kết quả – thử F5.</p>;

  if (!data?.knowdell_summary)
    return <p className="italic text-gray-500">Chưa có dữ liệu, vui lòng đợi…</p>;

  /* ---------- hiển thị kết quả ---------- */
  return (
    <div className="space-y-8">
      {/* Phân tích Markdown */}
      <article className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.knowdell_summary}
        </ReactMarkdown>
      </article>

      {/* Danh sách 5 nghề */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">5 nghề gợi ý</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 w-10">#</th>
                <th className="p-2">Nghề</th>
                <th className="p-2 w-16">Điểm</th>
                <th className="p-2">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {data.suggested_jobs?.map((j: any, i: number) => (
                <tr key={j.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{j.title}</td>
                  <td className="p-2">{j.score}</td>
                  <td className="p-2">{j.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
