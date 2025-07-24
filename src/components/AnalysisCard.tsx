/* ------------------------------------------------------------------------- *
   HIỂN THỊ KẾT QUẢ GPT (Markdown) – ĐÃ LOẠI JSON
 * ------------------------------------------------------------------------- */
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown          from "react-markdown";
import remarkGfm              from "remark-gfm";

export default function AnalysisCard() {
  const [md, setMd] = useState<string>();

  /* ----- lấy markdown từ API ------------------------------------------------ */
  useEffect(() => {
    fetch("/api/career/analyse")
      .then(r => (r.ok ? r.json() : { markdown: "" }))
      .then(d => setMd(d.markdown as string))
      .catch(() => setMd(""));
  }, []);

  /* ----- đang chờ ----------------------------------------------------------- */
  if (md === undefined)
    return (
      <div className="w-full rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
        Đang phân tích 20 nghề bạn đã chọn…
      </div>
    );

  /* ─── Làm SẠCH markdown ────────────────────────────────────────────────────
     1. Bỏ hẳn code-block  ```…```  (kể cả ghi ```json)
     2. Xóa phần JSON (tiêu đề & nội dung) – nhiều biến thể
     3. Gom dòng trắng dư                                                     */
  const cleaned = md
    /* 1 */
    .replace(/```[^]*?```/g, "")
    /* 2 – xoá từ tiêu đề JSON → trước Markdown Table hoặc hết file */
    .replace(
      /(^\s*(#+\s*Kết quả.+JSON|a\.\s*JSON)[\s\S]*?)(^\s*(b\.|#+\s*))/im,
      "$3"
    )
    .replace(/(^\s*(#+\s*Kết quả.+JSON|a\.\s*JSON)[\s\S]*)$/im, "")
    /* 3 */
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return null;            // nếu rỗng -> ẩn

  return (
    <div className="w-full rounded-lg border bg-white shadow-sm p-4 sm:p-6
                    max-h-[60vh] overflow-y-auto
                    scrollbar-thin scrollbar-thumb-gray-300">
      <article className="prose prose-sm sm:prose-base max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
      </article>
    </div>
  );
}
