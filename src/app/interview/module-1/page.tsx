"use client";

import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpTrayIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import ModuleSwitcher from "@/components/interview/ModuleSwitcher";
import {
  createClassicInterviewQuestions,
  fallbackDifficultyLevels,
  fallbackExperienceLevels,
  fallbackRoles,
  getFallbackQuestions,
  normalizeVietnameseInterviewLabel,
} from "@/app/api/interview/_lib/data";

type Option = { id: string | number; name: string };
type OptionsPayload = { roles: Option[]; difficulties: Option[]; experienceLevels: Option[] };
type QuestionMode = "industry" | "classic";

const categoryLabelMap: Record<string, { label: string; color: string }> = {
  behavioral:         { label: "Hành vi",        color: "bg-blue-100 text-blue-700" },
  situational:        { label: "Tình huống",      color: "bg-emerald-100 text-emerald-700" },
  pressure_case:      { label: "Áp lực",          color: "bg-rose-100 text-rose-700" },
  pressure_behavioral:{ label: "Áp lực",          color: "bg-rose-100 text-rose-700" },
  personalized:       { label: "Cá nhân hóa",     color: "bg-emerald-100 text-emerald-700" },
  technical:          { label: "Kỹ thuật",         color: "bg-amber-100 text-amber-700" },
  system_design:      { label: "Hệ thống",         color: "bg-cyan-100 text-cyan-700" },
  classic:            { label: "Câu hỏi kinh điển",color: "bg-orange-100 text-orange-700" },
};

export default function InterviewModuleOnePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [options, setOptions] = useState<OptionsPayload>({
    roles: fallbackRoles,
    difficulties: fallbackDifficultyLevels,
    experienceLevels: fallbackExperienceLevels,
  });
  const [questionMode, setQuestionMode] = useState<QuestionMode>("industry");
  const [roleId, setRoleId] = useState<string | number>(fallbackRoles[0]?.id ?? 1);
  const [difficultyLevelId, setDifficultyLevelId] = useState<string | number>(
    fallbackDifficultyLevels[1]?.id ?? 2
  );
  const [experienceLevelId, setExperienceLevelId] = useState<string | number>(
    fallbackExperienceLevels[0]?.id ?? 1
  );
  const [languageCode, setLanguageCode] = useState("vi");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateSummary, setCandidateSummary] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/interview/module-1/options");
        if (!res.ok) return;
        const raw = (await res.json()) as OptionsPayload;
        // DB trả về theo id (không có thứ tự logic) → sắp xếp theo thứ tự chuẩn của fallback,
        // mục lạ (không khớp tên) xếp cuối.
        const sortByFallback = (items: Option[], fallback: Option[]) => {
          const rank = (o: Option) => {
            const i = fallback.findIndex(
              (f) => normalizeVietnameseInterviewLabel(f.name) === normalizeVietnameseInterviewLabel(o.name)
            );
            return i === -1 ? Number.MAX_SAFE_INTEGER : i;
          };
          return [...items].sort((a, b) => rank(a) - rank(b));
        };
        const json: OptionsPayload = {
          // Chỉ giữ ngành có bộ câu hỏi (khớp theo tên) — ngành khác sẽ bị quy về "Nhân sự" khi luyện
          roles: (() => {
            const known = new Set(fallbackRoles.map((r) => normalizeVietnameseInterviewLabel(r.name)));
            const matched = raw.roles.filter((r) => known.has(normalizeVietnameseInterviewLabel(r.name)));
            return sortByFallback(matched.length ? matched : fallbackRoles, fallbackRoles);
          })(),
          difficulties: sortByFallback(raw.difficulties, fallbackDifficultyLevels),
          experienceLevels: sortByFallback(raw.experienceLevels, fallbackExperienceLevels),
        };
        setOptions(json);
        if (json.roles[0]?.id != null) setRoleId(json.roles[0].id);
        if (json.difficulties[1]?.id != null) setDifficultyLevelId(json.difficulties[1].id);
        else if (json.difficulties[0]?.id != null) setDifficultyLevelId(json.difficulties[0].id);
        // Mặc định cấp thấp nhất (Sinh viên / Thực tập sinh) vì khách chính là sinh viên
        if (json.experienceLevels[0]?.id != null) setExperienceLevelId(json.experienceLevels[0].id);
      } catch (loadError) {
        console.error("module 1 options fallback", loadError);
      }
    };
    load();
  }, []);

  const handleCvChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCvFileName(file?.name ?? "");
  };

  const selectedRole = normalizeVietnameseInterviewLabel(
    options.roles.find((item) => String(item.id) === String(roleId))?.name ?? "Ngành nghề"
  );
  const selectedDifficulty = normalizeVietnameseInterviewLabel(
    options.difficulties.find((item) => String(item.id) === String(difficultyLevelId))?.name ?? "Trung bình"
  );
  const selectedExperience = normalizeVietnameseInterviewLabel(
    options.experienceLevels.find((item) => String(item.id) === String(experienceLevelId))?.name ?? "Nhân viên"
  );

  const isPersonalized = false;

  // Map DB UUID/id → fallback integer id by name matching (question bank uses integers 1-12/1-3/1-7)
  const canonicalRoleId = useMemo(() => {
    const dbName = options.roles.find(r => String(r.id) === String(roleId))?.name;
    const normalized = normalizeVietnameseInterviewLabel(dbName);
    return fallbackRoles.find(r => normalizeVietnameseInterviewLabel(r.name) === normalized)?.id ?? 1;
  }, [options.roles, roleId]);

  const canonicalDifficultyId = useMemo(() => {
    const dbName = options.difficulties.find(d => String(d.id) === String(difficultyLevelId))?.name;
    const normalized = normalizeVietnameseInterviewLabel(dbName);
    return fallbackDifficultyLevels.find(d => normalizeVietnameseInterviewLabel(d.name) === normalized)?.id ?? 2;
  }, [options.difficulties, difficultyLevelId]);

  const canonicalExperienceId = useMemo(() => {
    const dbName = options.experienceLevels.find(e => String(e.id) === String(experienceLevelId))?.name;
    const normalized = normalizeVietnameseInterviewLabel(dbName);
    return fallbackExperienceLevels.find(e => normalizeVietnameseInterviewLabel(e.name) === normalized)?.id ?? 3;
  }, [options.experienceLevels, experienceLevelId]);

  // ─── Preview questions ─────────────────────────────────────────────────
  const previewQuestions = useMemo(() => {
    if (questionMode === "classic") {
      return createClassicInterviewQuestions(canonicalExperienceId);
    }
    return getFallbackQuestions(canonicalRoleId, canonicalDifficultyId, canonicalExperienceId).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionMode, canonicalRoleId, canonicalDifficultyId, canonicalExperienceId, selectedRole, selectedDifficulty, selectedExperience, jobTitle, jobDescription, candidateSummary, cvFileName]);

  // ─── Start session ─────────────────────────────────────────────────────
  const startSession = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/interview/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module_type: 1,
            role_id: null,
            difficulty_level_id: null,
            experience_level_id: null,
            language_code: languageCode,
            job_title: "",
            config: {
              session_meta: {
                roleId: canonicalRoleId,
                difficultyLevelId: canonicalDifficultyId,
                experienceLevelId: canonicalExperienceId,
                roleName: selectedRole,
                difficultyName: selectedDifficulty,
                experienceLevelName: selectedExperience,
              },
              personalization: {},
            },
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          if (json?.error === "QUOTA_EXCEEDED") {
            router.push("/pricing?reason=quota");
            return;
          }
          setError("Không tạo được session. Kiểm tra Supabase/OpenAI và thử lại.");
          return;
        }

        if (json?.local_mode) {
          setError("Đang chạy chế độ test local. Session này chưa lưu lên dashboard thật.");
        }
        if (typeof window !== "undefined" && json?.session_id) {
          window.sessionStorage.setItem(
            `interview:module1:session:${json.session_id}`,
            JSON.stringify({
              questionMode,
              personalization: {},
              languageCode,
              roleName: selectedRole,
              difficultyName: selectedDifficulty,
              experienceLevelName: selectedExperience,
              roleId,
              difficultyLevelId,
              experienceLevelId,
            })
          );
        }
        router.push(`/interview/session/${json.session_id}`);
      } catch (startError) {
        console.error(startError);
        setError("Không tạo được session. Kiểm tra Supabase/OpenAI và thử lại.");
      }
    });
  };

  const previewSubtitle =
    questionMode === "classic"
      ? `${selectedExperience} • 10 câu hỏi kinh điển`
      : isPersonalized
      ? `${selectedRole} • ${selectedDifficulty} • Đã cá nhân hóa`
      : `${selectedRole} • ${selectedDifficulty} • ${selectedExperience}`;

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Module 1"
        title="Luyện trả lời từng câu hỏi"
        description="Ghi âm câu trả lời của bạn. AI sẽ phân tích nội dung, cách diễn đạt và đưa ra feedback."
      />

      <ModuleSwitcher />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* CENTER ─ Config + Personalization */}
        <div className="space-y-5">

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setQuestionMode("industry")}
              className={`flex items-center gap-3 rounded-[22px] border px-5 py-4 text-left transition ${
                questionMode === "industry"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white/85 hover:border-slate-300"
              }`}
            >
              <div className={`rounded-xl p-2 ${questionMode === "industry" ? "bg-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <BriefcaseIcon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${questionMode === "industry" ? "text-emerald-800" : "text-slate-700"}`}>
                  Theo ngành nghề
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Câu hỏi chuyên sâu theo lĩnh vực</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setQuestionMode("classic")}
              className={`flex items-center gap-3 rounded-[22px] border px-5 py-4 text-left transition ${
                questionMode === "classic"
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 bg-white/85 hover:border-slate-300"
              }`}
            >
              <div className={`rounded-xl p-2 ${questionMode === "classic" ? "bg-orange-200 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${questionMode === "classic" ? "text-orange-800" : "text-slate-700"}`}>
                  Câu hỏi truyền thống
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Câu hỏi kinh điển mọi recruiter hỏi</p>
              </div>
            </button>
          </div>

          {/* Config */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700">
                <BriefcaseIcon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">Cấu hình buổi luyện</h2>
            </div>

            <div className="mt-5 space-y-4">
              {/* Role + Difficulty — only shown for industry mode */}
              {questionMode === "industry" && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Ngành nghề
                    </span>
                    <div className="relative">
                      <select
                        value={String(roleId)}
                        onChange={(e) => setRoleId(e.target.value)}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-300"
                      >
                        {options.roles.map((item) => (
                          <option key={item.id} value={item.id}>
                            {normalizeVietnameseInterviewLabel(item.name)}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Độ khó
                    </span>
                    <div className="relative">
                      <select
                        value={String(difficultyLevelId)}
                        onChange={(e) => setDifficultyLevelId(e.target.value)}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-300"
                      >
                        {options.difficulties.map((item) => (
                          <option key={item.id} value={item.id}>
                            {normalizeVietnameseInterviewLabel(item.name)}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </label>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Cấp bậc
                  </span>
                  <div className="relative">
                    <select
                      value={String(experienceLevelId)}
                      onChange={(e) => setExperienceLevelId(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-300"
                    >
                      {options.experienceLevels.map((item) => (
                        <option key={item.id} value={item.id}>
                          {normalizeVietnameseInterviewLabel(item.name)}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </label>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Ngôn ngữ
                  </span>
                  <div className="flex gap-2">
                    {[
                      { code: "vi", label: "Tiếng Việt" },
                      { code: "en", label: "English" },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguageCode(lang.code)}
                        className={`flex-1 rounded-2xl border px-3 py-3 text-xs font-semibold transition ${
                          languageCode === lang.code
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Personalization — only for industry mode */}
          {questionMode === "industry" && isPersonalized && (
            <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700">
                  <UserCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Cá nhân hóa câu hỏi</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tùy chọn — AI sẽ phân tích nội dung bạn nhập và tạo bộ câu hỏi riêng khi bắt đầu session.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Chức danh mục tiêu</span>
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="VD: Chuyên viên tuyển dụng, Kế toán viên, Digital Marketing..."
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-300"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả công việc (JD)</span>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    placeholder="Paste JD từ tin tuyển dụng — AI sẽ tạo câu hỏi bám sát nhiệm vụ và kỹ năng yêu cầu."
                    className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-emerald-300"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Tóm tắt kinh nghiệm / CV</span>
                  <textarea
                    value={candidateSummary}
                    onChange={(e) => setCandidateSummary(e.target.value)}
                    rows={5}
                    placeholder="Tóm tắt kinh nghiệm, kỹ năng, dự án nổi bật — AI sẽ liên hệ với thực tế của bạn khi đặt câu hỏi."
                    className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-emerald-300"
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-white">
                  <ArrowUpTrayIcon className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Tải CV (PDF / DOC / DOCX)</p>
                    <p className="mt-0.5 text-xs text-slate-500">Lưu tên file — dùng cho bước parse CV khi AI phân tích.</p>
                    {cvFileName && (
                      <p className="mt-1.5 truncate text-xs font-medium text-emerald-700">{cvFileName}</p>
                    )}
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvChange} />
                </label>
              </div>
            </article>
          )}

          {/* Classic mode hint */}
          {questionMode === "classic" && (
            <div className="rounded-[22px] border border-orange-200 bg-orange-50 px-5 py-4">
              <p className="text-sm font-semibold text-orange-900">Về bộ câu hỏi truyền thống</p>
              <p className="mt-1.5 text-sm leading-6 text-orange-800">
                Đây là bộ câu hỏi kinh điển mà hầu hết nhà tuyển dụng đều hỏi trong bất kỳ buổi phỏng vấn nào.
                Câu hỏi được thiết kế riêng theo cấp bậc bạn đã chọn. Không cần ngành nghề hay JD — tập trung
                luyện câu trả lời thật tự nhiên, rõ ràng và đúng trọng tâm.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={startSession}
            disabled={isPending}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed ${
              questionMode === "classic"
                ? "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
                : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
            }`}
          >
            <PlayCircleIcon className="h-5 w-5" />
            {isPending ? "Đang tạo session..." : "Bắt đầu luyện tập"}
          </button>
          <p className="text-center text-xs text-slate-500">
            Bạn sẽ được yêu cầu cấp quyền micro khi vào phiên ghi âm.
          </p>
        </div>

        {/* RIGHT ─ Question preview */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${questionMode === "classic" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                <DocumentTextIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Bộ câu hỏi dự kiến</h2>
                <p className="mt-0.5 text-xs text-slate-500">{previewSubtitle}</p>
              </div>
            </div>

            {questionMode === "industry" && isPersonalized && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs leading-5 text-emerald-800">
                  AI sẽ phân tích JD / CV và tạo câu hỏi riêng khi bắt đầu. Đây là bản xem trước.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {previewQuestions.map((question, index) => {
                const catInfo = categoryLabelMap[question.category] ?? {
                  label: question.category,
                  color: "bg-slate-100 text-slate-600",
                };
                return (
                  <div
                    key={question.id ?? index}
                    className="rounded-[18px] border border-slate-100 bg-slate-50/80 p-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        questionMode === "classic"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-5 text-slate-700">{question.content}</p>
                        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              {questionMode === "classic"
                ? "Câu hỏi cố định, không phụ thuộc ngành nghề"
                : isPersonalized
                ? "Câu hỏi thực tế do AI sinh khi bắt đầu session"
                : "Câu hỏi thay đổi khi bạn điều chỉnh cấu hình"}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
