"use client";

import { useEffect, useState } from "react";
import ReactMarkdown          from "react-markdown";
import remarkGfm              from "remark-gfm";

export default function AnalysisCard() {
  const [md, setMd] = useState<string>();

  /* Lấy markdown phân tích */
  useEffect(() => {
    fetch("/api/career/analyse")
      .then(r => (r.ok ? r.json() : { markdown: "" }))
      .then(d => setMd(d.markdown))
      .catch(() => setMd(""));
  }, []);

  /* Đang chờ */
  if (!md)
    return (
      <div className="w-full rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
        Đang phân tích 20 nghề bạn đã chọn …
      </div>
    );

  /* ─── Làm SẠCH markdown ─────────────────────────────
     1. Bỏ toàn bộ code-block  ```…```  (dù ghi ```json)
     2. Xóa đoạn a. JSON hay tiêu đề “Kết quả … JSON”
        → xoá từ đầu hàng đó tới trước b. Markdown Table hoặc hết file
     3. Gộp dòng trắng                                                  */
  const cleaned = md
    /* 1. code-block */
    .replace(/```[^]*?```/g, "")

    /* 2. đoạn JSON (gồm cả tiêu đề) */
    .replace(
      /(^\s*(#+\s*Kết quả.+JSON|a\.\s*JSON)[\s\S]*?)(^\s*(b\.|#+\s*))/im,
      "$3"
    )
    /* nếu JSON là đoạn cuối file */
    .replace(/(^\s*(#+\s*Kết quả.+JSON|a\.\s*JSON)[\s\S]*)$/im, "")

    /* 3. dòng trắng dư */
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  /* Nếu rỗng – ẩn luôn card */
  if (!cleaned) return null;

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
