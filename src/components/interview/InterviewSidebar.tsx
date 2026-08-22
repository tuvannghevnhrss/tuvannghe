"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BoltIcon,
  ChartBarSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  INTERVIEW_SIDEBAR_STORAGE_KEY,
  interviewModules,
  isInterviewFocusPage,
} from "@/components/interview/interviewNavConfig";

type AccessInfo = {
  package: string | null;
  packageName: string | null;
  limits: { module1: number | "unlimited"; module2: number | "unlimited"; module3: number | "unlimited" };
  used: { module1: number; module2: number; module3: number };
  remaining: { module1: number | null; module2: number | null; module3: number | null };
};

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
      {label}
    </span>
  );
}

function UsageBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number | "unlimited";
  remaining: number | null;
}) {
  if (limit === 0) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-400">
          <LockClosedIcon className="h-3 w-3" /> {label}
        </span>
        <span className="text-slate-400">—</span>
      </div>
    );
  }

  const pct = limit === "unlimited" ? 50 : Math.min(100, (used / (limit as number)) * 100);
  const color =
    remaining === 0 ? "bg-red-400" : remaining !== null && remaining <= 2 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{remaining === null ? "∞" : remaining} còn lại</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {remaining === 0 && (
        <Link href="/pricing" className="text-[11px] font-semibold text-emerald-600 hover:underline">
          Nâng cấp để có thêm lượt →
        </Link>
      )}
    </div>
  );
}

function PackageWidget({ collapsed }: { collapsed: boolean }) {
  const [info, setInfo] = useState<AccessInfo | null>(null);

  useEffect(() => {
    fetch("/api/interview/access")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info) return null;

  if (collapsed) {
    return (
      <div className="group relative mt-6 flex justify-center">
        <Link
          href="/pricing"
          aria-label="Gói của bạn"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-emerald-600 transition hover:bg-emerald-50"
        >
          <BoltIcon className="h-5 w-5" />
        </Link>
        <Tooltip label="Gói của bạn" />
      </div>
    );
  }

  const packageColor: Record<string, string> = {
    interview_starter: "bg-slate-100 text-slate-700",
    interview_pro: "bg-emerald-100 text-emerald-700",
    interview_premium: "bg-teal-100 text-teal-700",
  };
  const badgeClass = info.package
    ? packageColor[info.package] ?? "bg-slate-100 text-slate-700"
    : "bg-red-50 text-red-500";

  return (
    <div className="mt-6 space-y-3 rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Gói của bạn</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
          {info.packageName ?? "Chưa có gói"}
        </span>
      </div>

      <div className="space-y-2.5">
        <UsageBar label="Module 1" used={info.used.module1} limit={info.limits.module1} remaining={info.remaining.module1} />
        <UsageBar label="Module 2" used={info.used.module2} limit={info.limits.module2} remaining={info.remaining.module2} />
        <UsageBar label="Module 3" used={info.used.module3} limit={info.limits.module3} remaining={info.remaining.module3} />
      </div>

      {!info.package && (
        <Link
          href="/pricing"
          className="block w-full rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          Mua gói ngay
        </Link>
      )}
      {info.package && info.package !== "interview_premium" && (
        <Link
          href="/pricing"
          className="block w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Nâng cấp gói
        </Link>
      )}
    </div>
  );
}

export default function InterviewSidebar() {
  const pathname = usePathname();
  // null = user chưa từng bấm toggle -> dùng mặc định theo loại trang.
  // Khi đã có lựa chọn tường minh, giữ nguyên trạng thái đó ở mọi trang.
  const [explicitCollapsed, setExplicitCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(INTERVIEW_SIDEBAR_STORAGE_KEY);
    if (stored === "true") setExplicitCollapsed(true);
    else if (stored === "false") setExplicitCollapsed(false);
  }, []);

  const collapsed = explicitCollapsed !== null ? explicitCollapsed : isInterviewFocusPage(pathname);

  const toggle = () => {
    const next = !collapsed;
    setExplicitCollapsed(next);
    window.localStorage.setItem(INTERVIEW_SIDEBAR_STORAGE_KEY, String(next));
  };

  return (
    <aside className={`hidden shrink-0 transition-all duration-200 ease-in-out xl:block ${collapsed ? "w-20" : "w-72"}`}>
      <div
        className={`sticky top-24 relative rounded-[28px] border border-white/70 bg-white/82 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200 ease-in-out ${
          collapsed ? "px-2.5 py-5" : "p-5"
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className="absolute -right-3 top-9 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-emerald-600"
        >
          {collapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
        </button>

        <div className={`mb-6 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <Link
            href="/interview"
            aria-label="Interview Suite — Trang chủ"
            className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
          >
            <SparklesIcon className="h-6 w-6" />
            {collapsed && <Tooltip label="Interview Suite" />}
          </Link>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">Interview Suite</p>
              <h2 className="text-lg font-semibold text-slate-900">Luyện tập phỏng vấn</h2>
            </div>
          )}
        </div>

        <nav className="space-y-4">
          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Luyện tập</p>
            )}
            <div className="space-y-1.5">
              {interviewModules.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <div key={item.href} className={collapsed ? "group relative flex justify-center" : ""}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-start gap-3 rounded-2xl transition ${
                        collapsed ? "w-11 justify-center px-0 py-3" : "px-4 py-3"
                      } ${
                        active
                          ? "bg-emerald-50 text-emerald-700 shadow-inner"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold">{item.label}</span>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                        </div>
                      )}
                    </Link>
                    {collapsed && <Tooltip label={item.label} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {!collapsed && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tiến độ</p>
            )}
            <div className={collapsed ? "group relative flex justify-center" : ""}>
              <Link
                href="/interview/dashboard"
                aria-current={pathname.startsWith("/interview/dashboard") ? "page" : undefined}
                className={`flex items-start gap-3 rounded-2xl transition ${
                  collapsed ? "w-11 justify-center px-0 py-3" : "px-4 py-3"
                } ${
                  pathname.startsWith("/interview/dashboard")
                    ? "bg-emerald-50 text-emerald-700 shadow-inner"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ChartBarSquareIcon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold">Điểm số & lịch sử</span>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">Xem tiến độ luyện tập của bạn.</p>
                  </div>
                )}
              </Link>
              {collapsed && <Tooltip label="Tiến độ" />}
            </div>
          </div>
        </nav>

        <PackageWidget collapsed={collapsed} />
      </div>
    </aside>
  );
}
