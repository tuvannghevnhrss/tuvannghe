"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "trait",   label: "1. Đặc tính" },
  { key: "options", label: "2. Lựa chọn" },
  { key: "focus",   label: "3. Mục tiêu" },
  { key: "plan",    label: "4. Kế hoạch" },
];

export default function StepTabs({ current }: { current?: string }) {
  const search = useSearchParams();
  const step   = current ?? search.get("step") ?? "trait";

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {TABS.map((t) => {
        const active = t.key === step;
        return (
          <Link
            key={t.key}
            href={`/profile?step=${t.key}`}
            className={`rounded-md px-4 py-2 text-sm font-medium transition
              ${active
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
