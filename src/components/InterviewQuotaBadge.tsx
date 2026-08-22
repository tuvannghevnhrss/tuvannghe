"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AccessInfo = {
  package: string | null;
  packageName: string | null;
  remaining: { module1: number | null; module2: number | null; module3: number | null };
};

export default function InterviewQuotaBadge() {
  const [access, setAccess] = useState<AccessInfo | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/interview/access", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (alive) setAccess(data);
      })
      .catch(() => {
        /* im lặng — chỉ báo phụ, không nên chặn header nếu lỗi */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!access) return null;

  if (!access.package) {
    return (
      <Link
        href="/pricing"
        className="hidden items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 sm:inline-flex"
      >
        Chưa có gói phỏng vấn
      </Link>
    );
  }

  const parts = [
    access.remaining.module1 !== null ? `M1: ${access.remaining.module1}` : "M1: ∞",
    access.remaining.module2 !== null ? `M2: ${access.remaining.module2}` : "M2: ∞",
    access.remaining.module3 !== null ? `M3: ${access.remaining.module3}` : "M3: ∞",
  ].join(" · ");

  const outOfQuota =
    access.remaining.module1 === 0 && access.remaining.module2 === 0 && access.remaining.module3 === 0;

  return (
    <Link
      href={outOfQuota ? "/pricing?reason=quota" : "/interview/dashboard"}
      title={`Gói ${access.packageName ?? ""}: ${parts}`}
      className={`hidden items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition sm:inline-flex ${
        outOfQuota
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {outOfQuota ? "Đã hết lượt phỏng vấn" : `Lượt còn lại: ${parts}`}
    </Link>
  );
}
