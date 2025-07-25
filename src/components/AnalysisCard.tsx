/* ------------------------------------------------------------------------- *
   Phần hiển thị kết quả tab 2
 * ------------------------------------------------------------------------- */
"use client";

import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error("API");
  return r.json();
});

export default function AnalysisCard() {
  /* poll mỗi 5s tới khi có dữ liệu */
  const { data, error, isLoading } = useSWR(
    "/api/career/analyse",
    fetcher,
    { refreshInterval: 5000 }      // <= polling
  );

  if (isLoading) {
    return (
      <p className="italic text-gray-500">
        Đang phân tích… (có thể 15 - 30 giây)
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600">
        Lỗi tải kết quả – hãy F5 hoặc thử lại sau.
      </p>
    );
  }

  /* API trả 404 PROFILE_NOT_READY trong lúc GPT chạy -> SWR vẫn tiếp tục poll */
  if (!data?.knowdell_summary) {
    return (
      <p className="italic text-gray-500">
        Chưa có dữ liệu, vui lòng đợi…
      </p>
    );
  }

  /* --------------------------- render kết quả --------------------------- */
  return (
    <div className="space-y-8">
      {/* 1. Phân tích Knowdell - markdown */}
      <article className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.knowdell_summary}
        </ReactMarkdown>
      </article>

      {/* 2. 5 nghề gợi ý */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          5 nghề phù hợp nhất
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100 text-left text-sm">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Nghề</th>
                <th className="p-2">Điểm</th>
                <th className="p-2">Lý do</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.suggested_jobs?.map(
                (j: any, idx: number) => (
                  <tr key={j.id} className="border-t">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{j.title}</td>
                    <td className="p-2">{j.score}</td>
                    <td className="p-2">{j.reason}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
