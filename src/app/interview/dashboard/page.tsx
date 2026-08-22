"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import { listLocalInterviewDrafts } from "@/lib/interview/storage";
import type {
  InterviewDashboardStat,
  InterviewHistoryItem,
  InterviewInsight,
} from "@/lib/interview/types";

type SessionStatus = "draft" | "recording" | "processing" | "completed" | "failed";

type DashboardPayload = {
  stats: InterviewDashboardStat[];
  recentSessions: Array<{
    id: string;
    moduleId: string;
    role: string;
    level: string;
    score: number;
    status: SessionStatus;
    createdAt: string;
  }>;
  insights: InterviewInsight[];
};

const moduleLabel: Record<string, string> = {
  "module-1": "Module 1 · Ghi âm",
  "module-2": "Module 2 · Live AI",
  "module-3": "Module 3 · Thực tiễn",
};

// Nhãn hiển thị cho người dùng cuối — không bao giờ lộ trạng thái kỹ thuật
// thô (recording/processing/draft) ra UI, kể cả khi backend thêm trạng thái
// mới trong tương lai (fallback "Không xác định" thay vì in thẳng session.status).
const statusLabel: Record<SessionStatus, string> = {
  draft: "Đang thực hiện",
  recording: "Đang thực hiện",
  processing: "Đang phân tích",
  completed: "Hoàn tất",
  failed: "Phân tích thất bại",
};

function isKnownStatus(status: string): status is SessionStatus {
  return status in statusLabel;
}

function formatDate(value?: string) {
  if (!value) return "Mới lưu";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

type LoadState = "loading" | "ready" | "auth_required" | "error";

export default function InterviewProgressPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [localDrafts, setLocalDrafts] = useState<InterviewHistoryItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = () => {
    setState("loading");

    (async () => {
      try {
        const res = await fetch("/api/interview/dashboard", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          if (json?.error === "AUTH_REQUIRED") {
            setState("auth_required");
            return;
          }
          setState("error");
          return;
        }

        setPayload(json as DashboardPayload);
        // Draft cục bộ (chưa đồng bộ, do DB lỗi lúc tạo) luôn hiển thị riêng ở
        // khu vực "Bài luyện chưa hoàn thành" — không bao giờ trộn vào "Lịch
        // sử buổi phỏng vấn" (chỉ chứa session thật từ DB), bất kể tài khoản
        // đã có buổi thật hay chưa.
        setLocalDrafts(listLocalInterviewDrafts());
        setState("ready");
      } catch (fetchError) {
        console.error("load dashboard failed", fetchError);
        setState("error");
      }
    })();
  };

  useEffect(() => {
    load();
  }, []);

  if (state === "loading") {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="h-28 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[24px] border border-white/70 bg-white/60" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
        <span className="sr-only">Đang tải tiến độ...</span>
      </div>
    );
  }

  if (state === "auth_required") {
    return (
      <StateMessage
        icon="🔒"
        title="Phiên đăng nhập đã hết hạn"
        description="Vui lòng đăng nhập lại để xem tiến độ luyện phỏng vấn của bạn."
        actionHref="/signup?redirectedFrom=/interview/dashboard"
        actionLabel="Đăng nhập lại"
      />
    );
  }

  if (state === "error" || !payload) {
    return (
      <StateMessage
        icon="⚠️"
        title="Không thể tải tiến độ"
        description="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
        onRetry={load}
        retryLabel="Thử lại"
      />
    );
  }

  const hasRealSessions = payload.recentSessions.length > 0;
  const hasAnyData = hasRealSessions || localDrafts.length > 0;
  const completedForChart = payload.recentSessions.filter((s) => s.status === "completed" && s.score > 0);
  const showBigChart = completedForChart.length >= 3;
  const showFullChartDetails = completedForChart.length >= 4;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <InterviewPageHeader
          eyebrow="Tiến độ của tôi"
          title="Theo dõi quá trình luyện phỏng vấn"
          description="Trang này tổng hợp điểm số, lịch sử và nhận định AI sau mỗi buổi luyện."
        />
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/85 px-8 py-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <ClockIcon className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-950">Bạn chưa có buổi luyện nào</h2>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            Hãy bắt đầu với Module 1 để làm quen với cách AI đánh giá câu trả lời của bạn.
          </p>
          <Link
            href="/interview/module-1"
            className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Bắt đầu Module 1
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Tiến độ của tôi"
        title="Theo dõi quá trình luyện phỏng vấn"
        description="Điểm số, lịch sử và những điểm bạn cần cải thiện, tổng hợp từ các buổi luyện thật."
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {payload.stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-semibold text-slate-950">Lịch sử buổi phỏng vấn</h2>

            {hasRealSessions ? (
              <div className="mt-5 space-y-4">
                {payload.recentSessions.map((session) => {
                  const label = isKnownStatus(session.status) ? statusLabel[session.status] : "Không xác định";
                  const badgeClass =
                    session.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : session.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700";

                  return (
                    <div key={session.id} className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {moduleLabel[session.moduleId] ?? session.moduleId}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {session.role} · {session.level}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{formatDate(session.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{label}</span>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {session.status === "completed" ? `${session.score}/100` : "Đang tính"}
                          </p>
                        </div>
                      </div>
                      {session.status === "completed" && (
                        <div className="mt-3 flex justify-end">
                          <Link href={`/interview/results/${session.id}`} className="text-sm font-semibold text-emerald-600">
                            Xem kết quả
                          </Link>
                        </div>
                      )}
                      {session.status === "failed" && (
                        <div className="mt-3 flex justify-end">
                          <Link href={`/interview/session/${session.id}`} className="text-sm font-semibold text-emerald-600">
                            Thử lại
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Chưa có buổi phỏng vấn thật nào được ghi nhận trên hệ thống.
              </p>
            )}
          </article>

          {localDrafts.length > 0 && (
            <article className="rounded-[28px] border border-dashed border-amber-200 bg-amber-50/50 p-6">
              <h2 className="text-lg font-semibold text-slate-950">Bài luyện chưa hoàn thành</h2>
              <p className="mt-1 text-sm text-slate-500">
                Lưu tạm trên trình duyệt này — chưa đồng bộ lên hệ thống, không tính vào lịch sử thật.
              </p>

              <div className="mt-4 space-y-3">
                {localDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
                    <p className="text-sm font-semibold text-slate-950">{moduleLabel[draft.moduleId] ?? draft.moduleId}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {draft.role} · {draft.level}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">Bạn có một bài luyện chưa hoàn thành.</p>
                    <div className="mt-3 flex justify-end">
                      <Link href={`/interview/session/${draft.id}`} className="text-sm font-semibold text-emerald-600">
                        Tiếp tục
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-950">Xu hướng điểm số</h2>
            </div>

            {showBigChart ? (
              <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                <div className="flex h-48 items-end gap-4">
                  {[...completedForChart].reverse().map((session, index) => (
                    <div key={session.id} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full rounded-t-[14px] bg-gradient-to-t from-emerald-600 to-teal-400"
                          style={{ height: `${Math.max(session.score, 8)}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{session.score}</p>
                      {showFullChartDetails ? (
                        <p className="text-center text-[11px] leading-4 text-slate-400">
                          {moduleLabel[session.moduleId]?.split(" · ")[0] ?? session.moduleId}
                          <br />
                          {formatShortDate(session.createdAt)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Buổi {index + 1}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : completedForChart.length >= 2 ? (
              <div className="mt-5 space-y-2">
                <p className="text-sm leading-6 text-slate-700">
                  Bạn đã {completedForChart[0].score - completedForChart[1].score >= 0 ? "tăng" : "giảm"}{" "}
                  <span className="font-semibold">
                    {Math.abs(completedForChart[0].score - completedForChart[1].score)} điểm
                  </span>{" "}
                  so với buổi trước.
                </p>
                <p className="text-sm leading-6 text-slate-500">Hoàn thành thêm 1–2 buổi để xem biểu đồ tiến bộ.</p>
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                Bạn cần hoàn thành thêm buổi luyện để xem xu hướng tiến bộ.
              </p>
            )}
          </article>

          {payload.insights.length > 0 && (
            <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-950">Nhận định từ buổi gần nhất</h2>
              </div>
              <div className="mt-5 space-y-3">
                {payload.insights.map((insight) => (
                  <div key={insight.title} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{insight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{insight.text}</p>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function StateMessage({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  onRetry,
  retryLabel,
}: {
  icon: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/85 px-8 py-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
      </div>
      <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
      <p className="max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {actionLabel}
        </Link>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
