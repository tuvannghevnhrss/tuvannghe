"use client";

import { ChangeEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import ModuleSwitcher from "@/components/interview/ModuleSwitcher";
import {
  fallbackExperienceLevels,
  fallbackRoles,
  normalizeVietnameseInterviewLabel,
} from "@/app/api/interview/_lib/data";

type Option = { id: string | number; name: string };

type OptionsPayload = {
  roles: Option[];
  difficulties: Option[];
  experienceLevels: Option[];
};

const INTERVIEW_TYPES = [
  {
    value: "behavioral",
    label: "Hành vi (Behavioral)",
    description: "Câu hỏi STAR: kinh nghiệm, tình huống thực tế",
  },
  {
    value: "technical",
    label: "Kỹ thuật (Technical)",
    description: "Câu hỏi chuyên môn, nghiệp vụ theo ngành",
  },
  {
    value: "mixed",
    label: "Kết hợp (Mixed)",
    description: "Cả hành vi lẫn chuyên môn — phổ biến nhất",
  },
] as const;

const VOICE_OPTIONS = [
  { value: "shimmer", label: "Shimmer — Nữ, chuyên nghiệp" },
  { value: "nova", label: "Nova — Nữ, thân thiện" },
  { value: "alloy", label: "Alloy — Trung tính" },
] as const;

export default function InterviewModuleTwoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [options, setOptions] = useState<OptionsPayload>({
    roles: fallbackRoles,
    difficulties: [],
    experienceLevels: fallbackExperienceLevels,
  });

  const [roleId, setRoleId] = useState<string | number>(fallbackRoles[0]?.id ?? 1);
  const [experienceLevelId, setExperienceLevelId] = useState<string | number>(
    fallbackExperienceLevels[2]?.id ?? 3
  );
  const [interviewType, setInterviewType] = useState<"behavioral" | "technical" | "mixed">(
    "mixed"
  );
  const [voice, setVoice] = useState<"shimmer" | "nova" | "alloy">("shimmer");
  const [languageCode] = useState("vi");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateSummary, setCandidateSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/interview/module-1/options");
        if (!res.ok) return;
        const json = (await res.json()) as OptionsPayload;
        setOptions(json);
        if (json.roles[0]?.id != null) setRoleId(json.roles[0].id);
        if (json.experienceLevels[2]?.id != null) setExperienceLevelId(json.experienceLevels[2].id);
        else if (json.experienceLevels[0]?.id != null) setExperienceLevelId(json.experienceLevels[0].id);
      } catch {
        // fallback data already set
      }
    };
    load();
  }, []);

  const selectedRole = normalizeVietnameseInterviewLabel(
    options.roles.find((r) => String(r.id) === String(roleId))?.name ?? "Ngành nghề"
  );
  const selectedExperience = normalizeVietnameseInterviewLabel(
    options.experienceLevels.find((e) => String(e.id) === String(experienceLevelId))?.name ?? "Cấp bậc"
  );

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/interview/live/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role_id: roleId,
            experience_level_id: experienceLevelId,
            role_name: selectedRole,
            experience_level_name: selectedExperience,
            language_code: languageCode,
            interview_type: interviewType,
            voice,
            job_title: jobTitle.trim() || null,
            job_description: jobDescription.trim() || null,
            candidate_summary: candidateSummary.trim() || null,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 403) {
            router.push("/pricing?reason=quota");
            return;
          }
          setError("Không tạo được phiên phỏng vấn. Hãy thử lại sau.");
          return;
        }

        // Pass first turn data + local mode flag via sessionStorage
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            `interview:live:${json.session_id}`,
            JSON.stringify({
              roleName: selectedRole,
              experienceLevelName: selectedExperience,
              interviewType,
              firstTurn: json.turn,
              totalTurns: json.total_turns,
              localMode: json.local_mode ?? false,
              voice,
              languageCode,
              ...(json.meta ?? {}),
            })
          );
        }

        router.push(`/interview/live/${json.session_id}`);
      } catch {
        setError("Lỗi kết nối. Hãy kiểm tra mạng và thử lại.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Module 2"
        title="Phỏng vấn Live theo lượt"
        description="AI đặt câu hỏi → bạn trả lời → AI tiếp tục theo ngữ cảnh."
      />

      <ModuleSwitcher />

      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm leading-6 text-emerald-900">
        <span className="font-semibold">Khác Module 1: </span>
        Bạn không cần bấm gửi từng câu — cuộc phỏng vấn diễn ra liên tục theo từng lượt, gần với cảm giác phỏng vấn thật hơn.
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Role + Experience */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">Vị trí & cấp bậc</h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ngành nghề / Bộ phận
                </label>
                <select
                  value={String(roleId)}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                >
                  {options.roles.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {normalizeVietnameseInterviewLabel(r.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cấp bậc kinh nghiệm
                </label>
                <select
                  value={String(experienceLevelId)}
                  onChange={(e) => setExperienceLevelId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
                >
                  {options.experienceLevels.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {normalizeVietnameseInterviewLabel(e.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Chức danh mục tiêu (tùy chọn)
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Vd: Product Manager, Senior Backend Engineer..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </article>

          {/* Interview type */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">Loại phỏng vấn</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInterviewType(type.value)}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    interviewType === type.value
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{type.description}</p>
                </button>
              ))}
            </div>
          </article>

          {/* Personalization */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">
                Cá nhân hóa câu hỏi
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                  Tùy chọn
                </span>
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Cung cấp JD và tóm tắt CV để AI tạo câu hỏi sát với công việc thực tế của bạn.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mô tả công việc (JD)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setJobDescription(e.target.value)
                  }
                  rows={4}
                  placeholder="Dán nội dung JD vào đây..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tóm tắt kinh nghiệm / CV
                </label>
                <textarea
                  value={candidateSummary}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setCandidateSummary(e.target.value)
                  }
                  rows={3}
                  placeholder="Tóm tắt ngắn về kinh nghiệm, kỹ năng nổi bật..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </article>
        </div>

        {/* Right panel: summary + start */}
        <div className="space-y-5">
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">Tóm tắt cấu hình</h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {[
                { label: "Ngành nghề", value: selectedRole },
                { label: "Cấp bậc", value: selectedExperience },
                {
                  label: "Loại phỏng vấn",
                  value:
                    INTERVIEW_TYPES.find((t) => t.value === interviewType)?.label ??
                    interviewType,
                },
                {
                  label: "Giọng AI",
                  value:
                    VOICE_OPTIONS.find((v) => v.value === voice)?.label ?? voice,
                },
                { label: "Số lượt hỏi", value: "6 lượt" },
                {
                  label: "Cá nhân hóa",
                  value: jobDescription.trim() ? "Có JD" : "Dùng câu hỏi mặc định",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-slate-500">{row.label}</span>
                  <span className="text-right font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Voice selector */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-950">Giọng AI Interviewer</h2>
            <div className="mt-3 space-y-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVoice(v.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    voice === v.value
                      ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </article>

          {error && (
            <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-3 rounded-[22px] bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <SparklesIcon className="h-5 w-5" />
            {isPending ? "Đang chuẩn bị buổi phỏng vấn..." : "Bắt đầu phỏng vấn Live"}
          </button>

          <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 text-xs leading-6 text-slate-500">
            <p className="font-semibold text-slate-700">Quy trình buổi phỏng vấn</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>AI tự giới thiệu và đặt câu hỏi mở đầu bằng giọng nói</li>
              <li>Bạn nhấn giữ mic để trả lời</li>
              <li>AI phân tích và đặt câu hỏi tiếp theo theo ngữ cảnh</li>
              <li>Lặp lại 6 lượt rồi kết thúc buổi</li>
              <li>Xem báo cáo: điểm, thế mạnh, điểm yếu, gợi ý cải thiện</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
