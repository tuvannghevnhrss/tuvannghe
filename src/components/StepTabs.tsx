"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "trait", label: "Tổng quan kết quả" },
  { key: "options", label: "Gợi ý nghề phù hợp" },
  { key: "focus", label: "Mục tiêu nghề nghiệp" },
  { key: "plan", label: "Kế hoạch hành động" },
];

export default function StepTabs({ current }: { current?: string }) {
  const search = useSearchParams();
  const step = current ?? search.get("step") ?? "trait";

  return (
    <div className="flex flex-wrap gap-3">
      {TABS.map((tab) => {
        const active = tab.key === step;
        return (
          <Link
            key={tab.key}
            href={`/profile?step=${tab.key}`}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
