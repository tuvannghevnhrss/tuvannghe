"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bars3Icon, BoltIcon, ChartBarSquareIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { interviewModules } from "@/components/interview/interviewNavConfig";

// Sidebar cố định chỉ hiện từ xl trở lên (xem InterviewSidebar) — đây là
// đường duy nhất trên mobile để thấy đủ Module 1/2/3 + Tiến độ + Gói.
export default function InterviewMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mb-4 xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        aria-label="Mở menu Interview Suite"
      >
        <Bars3Icon className="h-5 w-5" />
        Interview Suite
      </button>

      <div className={`fixed inset-0 z-50 flex ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative flex h-full w-72 max-w-[85%] flex-col overflow-y-auto bg-white p-5 shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">Interview Suite</p>
                <h2 className="text-lg font-semibold text-slate-900">Luyện tập phỏng vấn</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Luyện tập</p>
          <div className="space-y-1.5">
            {interviewModules.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition ${
                    active ? "bg-emerald-50 text-emerald-700 shadow-inner" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="mb-2 mt-5 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tiến độ</p>
          <Link
            href="/interview/dashboard"
            aria-current={pathname.startsWith("/interview/dashboard") ? "page" : undefined}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition ${
              pathname.startsWith("/interview/dashboard")
                ? "bg-emerald-50 text-emerald-700 shadow-inner"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ChartBarSquareIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold">Điểm số & lịch sử</span>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">Xem tiến độ luyện tập của bạn.</p>
            </div>
          </Link>

          <Link
            href="/pricing"
            className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <BoltIcon className="h-5 w-5 shrink-0 text-emerald-600" />
            Gói của bạn
          </Link>
        </div>
      </div>
    </div>
  );
}
