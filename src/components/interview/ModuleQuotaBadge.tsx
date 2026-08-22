"use client";

import { useEffect, useState } from "react";

type AccessInfo = {
  remaining: { module1: number | null; module2: number | null; module3: number | null };
};

/** Hiện "X lượt còn lại" thật trên từng card module ở Interview Home — im
 * lặng (không hiện gì) nếu chưa đăng nhập hoặc API lỗi, không đoán/giả số. */
export default function ModuleQuotaBadge({ moduleKey }: { moduleKey: "module1" | "module2" | "module3" }) {
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/interview/access")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: AccessInfo | null) => {
        if (json) setRemaining(json.remaining[moduleKey]);
      })
      .catch(() => {});
  }, [moduleKey]);

  if (remaining === undefined) return null;

  if (remaining === 0) {
    return <span className="text-xs font-semibold text-rose-600">Đã hết lượt</span>;
  }

  return (
    <span className="text-xs font-semibold text-emerald-700">
      {remaining === null ? "Không giới hạn" : `${remaining} lượt còn lại`}
    </span>
  );
}
