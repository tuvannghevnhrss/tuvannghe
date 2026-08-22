"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const moduleLabel: Record<string, string> = {
  "module-1": "Module 1",
  "module-2": "Module 2",
  "module-3": "Module 3",
};

const moduleHref: Record<string, string> = {
  "module-1": "/interview/module-1",
  "module-2": "/interview/module-2",
  "module-3": "/interview/module-3",
};

type LatestSession = { moduleId: string; role: string; level: string } | null;

/**
 * Chỉ hiển thị khi có dữ liệu THẬT (buổi luyện gần nhất từ API) — không hiện
 * gì cả nếu chưa đăng nhập, chưa có buổi nào, hoặc API lỗi. Không dùng mock.
 */
export default function ContinuePracticeCard() {
  const [latest, setLatest] = useState<LatestSession>(null);

  useEffect(() => {
    fetch("/api/interview/dashboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const session = json?.recentSessions?.[0];
        if (session) {
          setLatest({ moduleId: session.moduleId, role: session.role, level: session.level });
        }
      })
      .catch(() => {
        /* im lặng — đây là gợi ý phụ, không chặn trang Hub nếu lỗi */
      });
  }, []);

  if (!latest || !moduleHref[latest.moduleId]) return null;

  return (
    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Tiếp tục luyện tập</p>
      <p className="mt-3 text-lg font-semibold text-slate-950">
        Bạn đang luyện: {moduleLabel[latest.moduleId]}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {latest.role} · {latest.level}
      </p>
      <Link
        href={moduleHref[latest.moduleId]}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Tiếp tục
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
