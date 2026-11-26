"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SignalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import ModuleSwitcher from "@/components/interview/ModuleSwitcher";
import {
  fallbackExperienceLevels,
  fallbackRoles,
  normalizeVietnameseInterviewLabel,
} from "@/app/api/interview/_lib/data";

type Option = { id: number; name: string };

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

export default function InterviewModuleThreePage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const [options, setOptions] = useState<OptionsPayload>({
    roles: fallbackRoles,
    difficulties: [],
    experienceLevels: fallbackExperienceLevels,
  });

  const [roleId, setRoleId] = useState<string | number>(fallbackRoles[0]?.id ?? 1);
  const [experienceLevelId, setExperienceLevelId] = useState<string | number>(
    fallbackExperienceLevels[0]?.id ?? 1
  );
  const [interviewType, setInterviewType] = useState<
    "behavioral" | "technical" | "mixed"
  >("mixed");
  const [voice, setVoice] = useState<"shimmer" | "nova" | "alloy">("shimmer");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateSummary, setCandidateSummary] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/interview/module-1/options");
        if (!res.ok) return;
        const raw = (await res.json()) as OptionsPayload;
        // Sắp xếp theo thứ tự chuẩn (DB trả theo id, không có thứ tự logic)
        const sortByFallback = <T extends { name: string }>(items: T[], fallback: { name: string }[]): T[] => {
          const rank = (o: { name: string }) => {
            const i = fallback.findIndex(
              (f) => normalizeVietnameseInterviewLabel(f.name) === normalizeVietnameseInterviewLabel(o.name)
            );
            return i === -1 ? Number.MAX_SAFE_INTEGER : i;
          };
          return [...items].sort((a, b) => rank(a) - rank(b));
        };
        const json: OptionsPayload = {
          ...raw,
          roles: sortByFallback(raw.roles, fallbackRoles),
          experienceLevels: sortByFallback(raw.experienceLevels, fallbackExperienceLevels),
        };
        setOptions(json);
        // Luôn chọn mục đầu của danh sách thật: id fallback (số) không tồn tại trong DB
        // nên giữ giá trị cũ làm select/tóm tắt hiện nhãn mặc định "Ngành nghề / Cấp bậc".
        if (json.roles[0]?.id != null) setRoleId(json.roles[0].id);
        if (json.experienceLevels[0]?.id != null) setExperienceLevelId(json.experienceLevels[0].id);
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
    options.experienceLevels.find((e) => String(e.id) === String(experienceLevelId))?.name ??
      "Cấp bậc"
  );

  const handleStart = () => {
    setIsStarting(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "interview:rt:config",
        JSON.stringify({
          roleName: selectedRole,
          experienceLevelName: selectedExperience,
          interviewType,
          voice,
          languageCode: "vi",
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          candidateSummary: candidateSummary.trim() || undefined,
        })
      );
    }
    router.push("/interview/module-3/live");
  };

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Module 3"
        title="Mô phỏng phỏng vấn thực tế"
        description="AI đóng vai người phỏng vấn. Cuộc trò chuyện diễn ra tự nhiên và có thể bị ngắt lời."
      />

      <ModuleSwitcher />
      <a href="/interview/module-3/v2" className="block rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 transition hover:bg-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Mới · Phiên bản 2</p>
        <p className="mt-1 text-base font-semibold text-slate-900">Phỏng vấn AI theo CV và JD thật của bạn</p>
        <p className="mt-1 text-sm text-slate-600">Tải CV (PDF/DOCX), nhập JD → AI lập kế hoạch, phỏng vấn thích ứng bằng giọng nói và chấm điểm theo năng lực của vị trí. Bấm để thử →</p>
      </a>

      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm leading-6 text-emerald-900">
        <span className="font-semibold">Khác Module 2: </span>
        Hội thoại liên tục, không cần chờ tới lượt — bạn có thể ngắt lời AI bất kỳ lúc nào, mô phỏng sát nhất với một buổi phỏng vấn thực tế.
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Role + Experience */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">
                Vị trí & cấp bậc
              </h2>
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
                    <option key={r.id} value={r.id}>
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
                    <option key={e.id} value={e.id}>
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
              <h2 className="text-xl font-semibold text-slate-950">
                Loại phỏng vấn
              </h2>
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
                  <p className="text-sm font-semibold text-slate-900">
                    {type.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {type.description}
                  </p>
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
              Cung cấp JD và tóm tắt CV để AI tạo câu hỏi sát với công việc
              thực tế của bạn.
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

        {/* Right panel */}
        <div className="space-y-5">
          {/* Summary */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <SignalIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-950">
                Tóm tắt cấu hình
              </h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {[
                { label: "Ngành nghề", value: selectedRole },
                { label: "Cấp bậc", value: selectedExperience },
                {
                  label: "Loại phỏng vấn",
                  value:
                    INTERVIEW_TYPES.find((t) => t.value === interviewType)
                      ?.label ?? interviewType,
                },
                {
                  label: "Giọng AI",
                  value:
                    VOICE_OPTIONS.find((v) => v.value === voice)?.label ??
                    voice,
                },
                { label: "Thời lượng", value: "Không giới hạn" },
                {
                  label: "Cá nhân hóa",
                  value: jobDescription.trim()
                    ? "Có JD"
                    : "Dùng câu hỏi mặc định",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-slate-500">{row.label}</span>
                  <span className="text-right font-semibold text-slate-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </article>

          {/* Voice selector */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-950">
              Giọng AI Interviewer
            </h2>
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

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="inline-flex w-full items-center justify-center gap-3 rounded-[22px] bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <SparklesIcon className="h-5 w-5" />
            {isStarting ? "Đang vào phòng..." : "Vào phòng phỏng vấn"}
          </button>

          <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 text-xs leading-6 text-slate-500">
            <p className="font-semibold text-slate-700">
              Khác với Module 2 như thế nào?
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Hội thoại liên tục — không cần nhấn nút sau mỗi câu</li>
              <li>AI tự phát hiện khi bạn dừng nói</li>
              <li>Bạn có thể ngắt lời AI bất kỳ lúc nào</li>
              <li>Cần cấp quyền camera và microphone</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
