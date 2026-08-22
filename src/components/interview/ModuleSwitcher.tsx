"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MicrophoneIcon, PlayCircleIcon, SignalIcon } from "@heroicons/react/24/outline";

const modules = [
  { href: "/interview/module-1", label: "Module 1", icon: MicrophoneIcon },
  { href: "/interview/module-2", label: "Module 2", icon: SignalIcon },
  { href: "/interview/module-3", label: "Module 3", icon: PlayCircleIcon },
];

/**
 * Luôn hiển thị (kể cả mobile, nơi InterviewSidebar bị ẩn) — đây là cách duy
 * nhất để chuyển thẳng sang module khác mà không cần quay về Interview Home.
 */
export default function ModuleSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn module luyện tập">
      {modules.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
