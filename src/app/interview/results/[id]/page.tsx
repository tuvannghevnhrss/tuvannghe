"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import { readLocalInterviewResult } from "@/lib/interview/storage";
import type { InterviewResultPayload } from "@/lib/interview/types";

const moduleLabel: Record<string, string> = {
  "module-1": "Module 1",
  "module-2": "Module 2",
  "module-3": "Module 3",
};

const nextModule: Record<string, { href: string; id: string }> = {
  "module-1": { href: "/interview/module-2", id: "module-2" },
  "module-2": { href: "/interview/module-3", id: "module-3" },
};

type LoadState = "loading" | "ready" | "not_found" | "auth_required" | "error";

export default function InterviewResultPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<InterviewResultPayload | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = () => {
    setState("loading");

    (async () => {
      // Nguồn chính LUÔN là dữ liệu thật từ server. localStorage chỉ dùng cho
      // kết quả tạo ở chế độ local (khi DB lỗi lúc phân tích) — thử SAU CÙNG,
      // không bao giờ thay thế dữ liệu thật.
      try {
        const res = await fetch(`/api/interview/results/${params.id}`, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as InterviewResultPayload;
          setResult(json);
          setState("ready");
          return;
        }

        const json = await res.json().catch(() => ({}));
        if (json?.error === "AUTH_REQUIRED") {
          setState("auth_required");
          return;
        }
        if (res.status !== 404) {
          setState("error");
          return;
        }
        // 404 từ server thật — thử kết quả local trước khi báo "không tìm thấy"
      } catch (fetchError) {
        console.error("load result failed", fetchError);
        setState("error");
        return;
      }

      const localResult = readLocalInterviewResult(params.id);
      if (localResult) {
        setResult(localResult);
        setState("ready");
        return;
      }

      setState("not_found");
    })();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (state === "loading") {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="h-28 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[24px] border border-white/70 bg-white/60" />
          ))}
        </div>
        <span className="sr-only">Đang tải kết quả...</span>
      </div>
    );
  }

  if (state === "auth_required") {
    return (
      <ResultMessage
        icon="🔒"
        title="Đăng nhập để xem kết quả"
        description="Kết quả buổi phỏng vấn được lưu theo tài khoản. Hãy đăng nhập để xem."
        actionHref={`/signup?redirectedFrom=${encodeURIComponent(`/interview/results/${params.id}`)}`}
        actionLabel="Đăng nhập"
      />
    );
  }

  if (state === "not_found") {
    return (
      <ResultMessage
        icon="🔍"
        title="Không tìm thấy kết quả"
        description="Kết quả của buổi luyện này chưa có hoặc bạn không có quyền xem. Nếu bạn vừa hoàn thành buổi luyện, hãy thử lại sau ít phút."
        actionHref="/interview/dashboard"
        actionLabel="Về Tiến độ"
      />
    );
  }

  if (state === "error" || !result) {
    return (
      <ResultMessage
        icon="⚠️"
        title="Không thể tải kết quả"
        description="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
        onRetry={load}
        retryLabel="Thử lại"
      />
    );
  }

  const next = nextModule[result.moduleId];

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Kết quả phỏng vấn"
        title={`${result.role} · ${result.level}`}
        description="Bạn đã hoàn thành buổi luyện này. Dưới đây là đánh giá chi tiết từ AI."
      />

      {/* Điểm tổng — nổi bật nhất */}
      <section className="rounded-[28px] border border-emerald-200 bg-white/90 p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Điểm tổng</p>
        <p className="mt-2 text-6xl font-bold text-slate-950">{result.overallScore}</p>
        <p className="mt-1 text-sm text-slate-400">/ 100</p>
      </section>

      {/* 3 điểm thành phần — thứ cấp */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Giao tiếp", value: result.communicationScore },
          { label: "Nội dung", value: result.contentScore },
          { label: "Sự tự tin", value: result.confidenceScore },
        ].map((item) => (
          <article key={item.label} className="rounded-[22px] border border-white/70 bg-white/85 p-4 text-center shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold text-slate-950">Điểm mạnh</h2>
          <div className="mt-4 space-y-2">
            {result.strengths.length ? (
              result.strengths.map((item) => (
                <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {item}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold text-slate-950">Cần cải thiện</h2>
          <div className="mt-4 space-y-2">
            {result.weaknesses.length ? (
              result.weaknesses.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {item}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
            )}
          </div>
        </article>
      </section>

      {result.suggestions.length > 0 && (
        <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold text-slate-950">Gợi ý hành động</h2>
          <div className="mt-4 space-y-2">
            {result.suggestions.map((item) => (
              <div key={item} className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="flex-shrink-0 text-emerald-500">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript — thông tin phụ, đặt cuối, ít nổi bật nhất */}
      {result.transcriptPreview && (
        <details className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600">
            Xem nội dung ghi âm (transcript)
          </summary>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {result.transcriptPreview}
          </pre>
        </details>
      )}

      {/* CTA bắt buộc — không để Results là dead end */}
      <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
        <p className="text-sm font-semibold text-slate-300">Bạn muốn làm gì tiếp theo?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/interview/${result.moduleId}`}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Luyện lại {moduleLabel[result.moduleId]}
          </Link>
          {next && (
            <Link
              href={next.href}
              className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Thử {moduleLabel[next.id]}
            </Link>
          )}
          <Link
            href="/interview/dashboard"
            className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Xem tiến độ
          </Link>
        </div>
      </section>
    </div>
  );
}

function ResultMessage({
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
