"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import {
  ArrowRightIcon,
  MicrophoneIcon,
  StopIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import {
  createClassicInterviewQuestions,
  isLocalInterviewSessionId,
  normalizeVietnameseInterviewLabel,
  type InterviewPersonalization,
} from "@/app/api/interview/_lib/data";
import {
  removeLocalInterviewDraft,
  saveLocalInterviewDraft,
  saveLocalInterviewResult,
} from "@/lib/interview/storage";

type Question = {
  id?: number;
  content: string;
  interview_roles?: { name?: string | null } | null;
  interview_difficulty_levels?: { name?: string | null } | null;
  interview_experience_levels?: { name?: string | null } | null;
  generated?: boolean;
};

type StoredModuleOneSession = {
  questionMode?: "industry" | "classic";
  personalization?: InterviewPersonalization;
  languageCode?: string;
  roleName?: string;
  difficultyName?: string;
  experienceLevelName?: string;
  roleId?: string | number;
  difficultyLevelId?: string | number;
  experienceLevelId?: string | number;
};

type SessionPayload = {
  session: {
    id: string;
    role_id?: number;
    difficulty_level_id?: number;
    experience_level_id?: number;
    module_type?: number;
    language_code?: string;
    job_title?: string | null;
    config?: {
      personalization?: {
        jobTitle?: string;
        jobDescription?: string;
        candidateSummary?: string;
        cvFileName?: string;
      };
    };
    interview_roles?: { name?: string | null } | null;
    interview_difficulty_levels?: { name?: string | null } | null;
    interview_experience_levels?: { name?: string | null } | null;
  };
  questions: Question[];
};

type AnswerState = {
  transcript?: string;
  transcriptSource?: string;
  transcriptFallbackReason?: string | null;
  feedback?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    tips: string[];
  };
  uploaded?: boolean;
  status?: "draft" | "processing" | "completed" | "failed";
  selectedTakeId?: string | null;
};

type Attempt = {
  id: string;
  blob: Blob | null;
  objectUrl: string;
  durationSeconds: number;
  index: number;
  takeId: string | null;
  uploadStatus: "uploading" | "uploaded" | "failed";
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}p${s.toString().padStart(2, "0")}s` : `${s}s`;
}

export default function InterviewSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const allObjectUrlsRef = useRef<string[]>([]);
  // capture currentIndex inside onstop closure
  const currentIndexRef = useRef<number>(0);

  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  const [sessionPayload, setSessionPayload] = useState<SessionPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Lỗi khi TẢI session (không tồn tại / hết hạn đăng nhập / lỗi server) — khác
  // với `error` (lỗi khi thao tác như phân tích thất bại, vẫn còn recording để
  // xem/thử lại). Khi có loadError, toàn trang chuyển sang màn hình lỗi, không
  // render question/recording/progress — tránh trạng thái mâu thuẫn (vừa báo
  // "không tìm thấy phiên" vừa hiện "Bản ghi của bạn · 2 bản").
  const [loadError, setLoadError] = useState<{ code: string; message: string } | null>(null);
  const [answerState, setAnswerState] = useState<Record<number, AnswerState>>({});
  const [draftTranscript, setDraftTranscript] = useState("");
  const [aiReading, setAiReading] = useState(false);

  // attempts per question index
  const [attemptsByQ, setAttemptsByQ] = useState<Record<number, Attempt[]>>({});
  // selected attempt id per question index
  const [selectedByQ, setSelectedByQ] = useState<Record<number, string>>({});

  const questions = sessionPayload?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const currentAnswer = answerState[currentIndex];
  const currentAttempts = attemptsByQ[currentIndex] ?? [];
  const selectedAttemptId = selectedByQ[currentIndex] ?? "";
  const selectedAttempt = currentAttempts.find((a) => a.id === selectedAttemptId) ?? null;

  // sync ref
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // revoke all objectURLs on unmount
  useEffect(() => {
    return () => {
      allObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      speechRecognitionRef.current?.stop();
      questionAudioRef.current?.pause();
      questionAudioRef.current = null;
    };
  }, []);

  // Auto-play TTS when question changes
  useEffect(() => {
    if (!sessionPayload) return;
    const question = sessionPayload.questions[currentIndex];
    if (!question?.content) return;

    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
    }

    setAiReading(true);
    let cancelled = false;

    // Safety net: clear badge after 25s in case onended never fires
    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) setAiReading(false);
    }, 25_000);

    const done = () => {
      if (!cancelled) { window.clearTimeout(safetyTimer); setAiReading(false); }
    };

    fetch(`/api/interview/tts?text=${encodeURIComponent(question.content)}&voice=shimmer`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP_${r.status}`);
        return r.json() as Promise<{ url?: string }>;
      })
      .then(({ url }) => {
        if (cancelled || !url) { done(); return; }
        const audio = new Audio(url);
        questionAudioRef.current = audio;
        audio.addEventListener("ended", done);
        audio.addEventListener("error", done);
        audio.play().catch(done);
      })
      .catch(() => { if (!cancelled) done(); });

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
      questionAudioRef.current?.pause();
      questionAudioRef.current = null;
      setAiReading(false);
    };
  }, [currentIndex, sessionPayload]);

  useEffect(() => {
    // Khôi phục take + answer đã lưu trên server — để recording/kết quả
    // không mất khi refresh trang (chỉ áp dụng session thật, không phải local-*).
    const hydrateTakes = async () => {
      if (isLocalInterviewSessionId(params.id)) return;
      try {
        const res = await fetch(`/api/interview/session/${params.id}/takes`);
        if (!res.ok) return;
        const json = await res.json();

        const takes = (json.takes ?? {}) as Record<string, any[]>;
        const answers = (json.answers ?? {}) as Record<string, any>;

        const nextAttemptsByQ: Record<number, Attempt[]> = {};
        const nextSelectedByQ: Record<number, string> = {};
        for (const [qIdxStr, list] of Object.entries(takes)) {
          const qIdx = Number(qIdxStr);
          nextAttemptsByQ[qIdx] = list.map((t: any, i: number) => ({
            id: t.take_id,
            blob: null,
            objectUrl: t.signed_url ?? "",
            durationSeconds: t.duration_seconds ?? 0,
            index: i + 1,
            takeId: t.take_id,
            uploadStatus: "uploaded" as const,
          }));
        }

        const nextAnswerState: Record<number, AnswerState> = {};
        for (const [qIdxStr, a] of Object.entries(answers)) {
          const qIdx = Number(qIdxStr);
          if (a.selected_take_id) nextSelectedByQ[qIdx] = a.selected_take_id;
          nextAnswerState[qIdx] = {
            transcript: a.transcript ?? "",
            feedback: a.feedback ?? undefined,
            uploaded: a.status === "completed",
            status: a.status,
            selectedTakeId: a.selected_take_id,
          };
        }

        if (Object.keys(nextAttemptsByQ).length > 0) {
          setAttemptsByQ((prev) => ({ ...nextAttemptsByQ, ...prev }));
        }
        if (Object.keys(nextSelectedByQ).length > 0) {
          setSelectedByQ((prev) => ({ ...nextSelectedByQ, ...prev }));
        }
        if (Object.keys(nextAnswerState).length > 0) {
          setAnswerState((prev) => ({ ...nextAnswerState, ...prev }));
        }
      } catch (hydrateError) {
        console.error("hydrateTakes failed:", hydrateError);
      }
    };

    const loadSession = async () => {
      try {
        const res = await fetch(`/api/interview/session/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          // route trả { error: "SESSION_NOT_FOUND" } trực tiếp, hoặc
          // { error: "SESSION_LOAD_FAILED", message: "AUTH_REQUIRED" } cho lỗi auth/hệ thống.
          const code = json?.error === "SESSION_LOAD_FAILED" ? json?.message : json?.error;
          throw new Error(code ?? "LOAD_SESSION_FAILED");
        }

        const storedRaw =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(`interview:module1:session:${params.id}`)
            : null;
        const stored = storedRaw ? (JSON.parse(storedRaw) as StoredModuleOneSession) : null;

        if (stored?.questionMode === "classic") {
          const expId = stored.experienceLevelId ?? json.session?.experience_level_id ?? 3;
          setSessionPayload({
            ...json,
            session: {
              ...json.session,
              language_code: json.session?.language_code ?? stored.languageCode ?? "vi",
              interview_roles: { name: "Phỏng vấn truyền thống" },
              interview_difficulty_levels: { name: "Câu hỏi kinh điển" },
              interview_experience_levels:
                json.session?.interview_experience_levels ??
                { name: stored.experienceLevelName ?? "Nhân viên" },
            },
            questions: createClassicInterviewQuestions(expId),
          });
          await hydrateTakes();
          setLoading(false);
          return;
        }

        const sessionMeta = json.session?.config?.session_meta ?? null;
        const mergedSession = stored
          ? {
              ...json.session,
              language_code: json.session?.language_code ?? stored.languageCode ?? "vi",
              job_title: json.session?.job_title ?? stored.personalization?.jobTitle ?? null,
              config: {
                ...(json.session?.config ?? {}),
                personalization: stored.personalization ?? json.session?.config?.personalization ?? {},
              },
              interview_roles: json.session?.interview_roles?.name
                ? json.session.interview_roles
                : { name: stored.roleName ?? sessionMeta?.roleName },
              interview_difficulty_levels: json.session?.interview_difficulty_levels?.name
                ? json.session.interview_difficulty_levels
                : { name: stored.difficultyName ?? sessionMeta?.difficultyName },
              interview_experience_levels: json.session?.interview_experience_levels?.name
                ? json.session.interview_experience_levels
                : { name: stored.experienceLevelName ?? sessionMeta?.experienceLevelName },
            }
          : json.session;

        setSessionPayload({ ...json, session: mergedSession });
        await hydrateTakes();
      } catch (err) {
        console.error(err);
        const code = err instanceof Error ? err.message : "";
        setLoadError({
          code,
          message:
            code === "AUTH_REQUIRED"
              ? "Phiên đăng nhập đã hết hạn."
              : code === "SESSION_NOT_FOUND"
                ? "Phiên phỏng vấn này không còn tồn tại hoặc bạn không có quyền truy cập."
                : "Không tải được phiên phỏng vấn. Vui lòng thử lại.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [params.id]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      if (!startedAtRef.current) return;
      setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!sessionPayload) return;
    const analyzedAnswers = Object.values(answerState).filter((item) => item.uploaded);
    const latestFeedback = analyzedAnswers[analyzedAnswers.length - 1]?.feedback;
    const latestTranscript = analyzedAnswers[analyzedAnswers.length - 1]?.transcript ?? "";
    const draftSummary =
      latestFeedback?.tips?.[0] ??
      latestFeedback?.weaknesses?.[0] ??
      latestTranscript.slice(0, 160) ??
      "Buổi đang được thực hành, chưa hoàn tất báo cáo.";

    saveLocalInterviewDraft({
      id: sessionPayload.session.id,
      moduleId: "module-1",
      role: sessionPayload.session.interview_roles?.name ?? "Unknown",
      level: sessionPayload.session.interview_experience_levels?.name ?? "Unknown",
      score: latestFeedback?.score ?? 0,
      createdAt: new Date().toISOString(),
      summary:
        analyzedAnswers.length > 0
          ? `Đang làm dở • Đã phân tích ${analyzedAnswers.length}/${questions.length} câu • ${draftSummary}`
          : "Đang làm dở • Chưa gửi câu trả lời lên để phân tích",
      status: "draft",
    });
  }, [answerState, questions.length, sessionPayload]);

  // Upload 1 take ngay sau khi dừng ghi âm — không đợi tới lúc phân tích, để
  // recording không mất khi user refresh trang trước khi bấm "Phân tích".
  const uploadTake = async (localId: string, blob: Blob, qIdx: number, durationSeconds: number) => {
    try {
      const form = new FormData();
      form.append("audio", blob, `take-${qIdx + 1}.webm`);
      form.append("answer_index", String(qIdx));
      form.append("duration_seconds", String(durationSeconds));

      const res = await fetch(`/api/interview/session/${params.id}/takes`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "TAKE_UPLOAD_FAILED");

      setAttemptsByQ((prev) => ({
        ...prev,
        [qIdx]: (prev[qIdx] ?? []).map((a) =>
          a.id === localId ? { ...a, takeId: json.take_id, uploadStatus: "uploaded" as const } : a
        ),
      }));
    } catch (uploadError) {
      console.error("uploadTake failed:", uploadError);
      setAttemptsByQ((prev) => ({
        ...prev,
        [qIdx]: (prev[qIdx] ?? []).map((a) =>
          a.id === localId ? { ...a, uploadStatus: "failed" as const } : a
        ),
      }));
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      setDraftTranscript("");

      const SpeechRecognitionCtor =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognitionCtor) {
        const recognition: BrowserSpeechRecognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = sessionPayload?.session.language_code === "en" ? "en-US" : "vi-VN";
        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i += 1) {
            transcript += event.results[i][0]?.transcript ?? "";
          }
          setDraftTranscript(transcript.trim());
        };
        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const objectUrl = URL.createObjectURL(blob);
        const dur = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const qIdx = currentIndexRef.current;
        const newAttempt: Attempt = {
          id: uuid(),
          blob,
          objectUrl,
          durationSeconds: dur,
          index: 0,
          takeId: null,
          uploadStatus: "uploading",
        };

        allObjectUrlsRef.current.push(objectUrl);

        setAttemptsByQ((prev) => {
          const existing = prev[qIdx] ?? [];
          newAttempt.index = existing.length + 1;
          const updated = [...existing, newAttempt];
          return { ...prev, [qIdx]: updated };
        });

        setSelectedByQ((prev) => {
          // auto-select bản đầu tiên; nếu user đã chọn 1 bản trước đó thì giữ nguyên
          if (!prev[qIdx]) return { ...prev, [qIdx]: newAttempt.id };
          return prev;
        });

        setDurationSeconds(dur);
        stream.getTracks().forEach((track) => track.stop());
        speechRecognitionRef.current?.stop();

        void uploadTake(newAttempt.id, blob, qIdx, dur);
      };

      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      recorder.start();
      setRecording(true);
    } catch (recordError) {
      console.error(recordError);
      setError("Không truy cập được micro. Hãy kiểm tra quyền trình duyệt.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    speechRecognitionRef.current?.stop();
    setRecording(false);
  };

  const deleteAttempt = (attemptId: string) => {
    const attempt = currentAttempts.find((a) => a.id === attemptId);
    if (attempt) URL.revokeObjectURL(attempt.objectUrl);

    const remaining = currentAttempts.filter((a) => a.id !== attemptId);
    setAttemptsByQ((prev) => ({ ...prev, [currentIndex]: remaining }));

    if (selectedAttemptId === attemptId) {
      const fallback = remaining[remaining.length - 1]?.id ?? "";
      setSelectedByQ((prev) => ({ ...prev, [currentIndex]: fallback }));
    }
    setDeleteConfirmId(null);
  };

  const selectAttempt = (attemptId: string) => {
    setSelectedByQ((prev) => ({ ...prev, [currentIndex]: attemptId }));
  };

  const analyzeSelectedAttempt = async () => {
    if (!currentQuestion || !selectedAttempt || busy) return;
    // Take chưa upload xong (hoặc upload lỗi) — chưa có gì để phân tích.
    if (selectedAttempt.uploadStatus !== "uploaded" && !isLocalInterviewSessionId(params.id)) return;

    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      if (typeof currentQuestion.id === "number" && currentQuestion.id > 0 && !currentQuestion.generated) {
        form.append("question_id", String(currentQuestion.id));
      }
      form.append("prompt_text", currentQuestion.content);
      form.append("answer_index", String(currentIndex));
      form.append("transcript_text", draftTranscript);
      form.append("language_code", sessionPayload?.session.language_code ?? "vi");

      if (isLocalInterviewSessionId(params.id)) {
        // Session demo/local: chưa có take thật trên server, vẫn gửi audio thô.
        if (!selectedAttempt.blob) return;
        form.append("audio", selectedAttempt.blob, `answer-${currentIndex + 1}.webm`);
      } else {
        // Session thật: audio ĐÃ được upload lúc dừng ghi âm — chỉ cần gửi take_id,
        // tránh upload lại cùng 1 file.
        form.append("take_id", selectedAttempt.takeId ?? "");
      }

      const res = await fetch(`/api/interview/session/${params.id}/answers`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error ?? "ANSWER_UPLOAD_FAILED");

      setAnswerState((prev) => ({
        ...prev,
        [currentIndex]: {
          transcript: json.transcript,
          transcriptSource: json.transcript_source,
          transcriptFallbackReason: json.transcript_fallback_reason,
          feedback: json.feedback,
          uploaded: true,
          status: "completed",
          selectedTakeId: selectedAttempt.takeId,
        },
      }));
    } catch (analyzeError) {
      console.error(analyzeError);
      const code = analyzeError instanceof Error ? analyzeError.message : "";
      if (code === "AUTH_REQUIRED") {
        setError("Bạn cần đăng nhập để lưu kết quả vào dashboard.");
      } else if (code === "SESSION_NOT_FOUND") {
        setError("Không tìm thấy phiên phỏng vấn. Vui lòng quay lại danh sách phỏng vấn và thử lại.");
      } else if (code === "AUDIO_REQUIRED" || code === "TAKE_NOT_FOUND" || code === "TAKE_ID_REQUIRED") {
        setError("Không tìm thấy bản ghi âm. Vui lòng ghi âm lại.");
      } else {
        setError(
          "Dịch vụ phân tích AI đang tạm thời không khả dụng. Bản ghi của bạn vẫn được lưu, bạn có thể thử phân tích lại."
        );
      }
      setAnswerState((prev) => ({
        ...prev,
        [currentIndex]: { ...prev[currentIndex], status: "failed" },
      }));
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    setDurationSeconds(0);
    setDraftTranscript("");
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const finishSession = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/interview/session/${params.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: selectedRole,
          difficultyName: selectedDifficulty,
          experienceLevelName: selectedExperience,
          languageCode: sessionPayload?.session.language_code ?? "vi",
          answers: questions.map((question, index) => ({
            question: question.content,
            transcript: answerState[index]?.transcript ?? "",
            feedback: answerState[index]?.feedback ?? null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "COMPLETE_FAILED");

      if (json?.local_mode && json?.result) {
        saveLocalInterviewResult(json.result);
        removeLocalInterviewDraft(params.id);
      }

      router.push(`/interview/results/${json.result_id}`);
    } catch (completeError) {
      console.error(completeError);
      setError("Không tổng hợp được buổi phỏng vấn. Hãy thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="h-28 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden h-64 animate-pulse rounded-[28px] border border-white/70 bg-white/60 lg:block" />
          <div className="space-y-5">
            <div className="h-40 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
            <div className="h-28 animate-pulse rounded-[28px] border border-white/70 bg-white/60" />
          </div>
        </div>
        <span className="sr-only">Đang tải phiên phỏng vấn...</span>
      </div>
    );
  }

  // Session không tải được (không tồn tại / hết quyền / hết phiên đăng nhập) —
  // hiện MỘT màn hình lỗi duy nhất, không render câu hỏi/recording/progress.
  if (loadError) {
    const isAuthError = loadError.code === "AUTH_REQUIRED";
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/85 px-8 py-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <span className="text-2xl" aria-hidden>
            {isAuthError ? "🔒" : "🔍"}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-slate-950">
          {isAuthError ? "Phiên đăng nhập đã hết hạn" : "Không tìm thấy phiên phỏng vấn"}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-slate-500">{loadError.message}</p>
        {isAuthError ? (
          <button
            type="button"
            onClick={() => router.push(`/signup?redirectedFrom=${encodeURIComponent(`/interview/session/${params.id}`)}`)}
            className="mt-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Đăng nhập lại
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/interview/module-1")}
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            ← Quay lại danh sách phỏng vấn
          </button>
        )}
      </div>
    );
  }

  const selectedRole = normalizeVietnameseInterviewLabel(
    sessionPayload?.session.interview_roles?.name ?? "Unknown"
  );
  const selectedDifficulty = normalizeVietnameseInterviewLabel(
    sessionPayload?.session.interview_difficulty_levels?.name ?? "Unknown"
  );
  const selectedExperience = normalizeVietnameseInterviewLabel(
    sessionPayload?.session.interview_experience_levels?.name ?? "Unknown"
  );
  const answeredCount = Object.values(answerState).filter((a) => a.uploaded).length;

  return (
    <div className="space-y-6">
      <InterviewPageHeader
        eyebrow="Module 1 · Session"
        title={`Buổi ghi âm • ${selectedRole}`}
        description="Ghi âm, chọn bản tốt nhất rồi phân tích."
      />

      {/* Progress — gọn, chỉ 1 chỉ số */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-5 py-2.5 shadow-sm">
        <span className="text-sm font-semibold text-slate-700">
          Câu {currentIndex + 1}/{questions.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* ── Sidebar: Question list — gọn, chỉ trạng thái, không preview nội dung ── */}
        <aside className="hidden rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:block lg:self-start">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Câu hỏi</h2>
          <div className="space-y-1">
            {questions.map((question, index) => {
              const answer = answerState[index];
              const takeCount = attemptsByQ[index]?.length ?? 0;
              const isCurrent = index === currentIndex;

              let statusIcon: ReactNode = null;
              let statusText = "Chưa trả lời";
              if (answer?.uploaded) {
                statusIcon = <CheckCircleSolid className="h-4 w-4 flex-shrink-0 text-emerald-500" />;
                statusText = "Đã phân tích";
              } else if (takeCount > 0) {
                statusIcon = <MicrophoneIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />;
                statusText = `${takeCount} bản`;
              }

              return (
                <button
                  key={`${question.id ?? "q"}-${index}`}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isCurrent
                      ? "bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>Câu {index + 1}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    {statusIcon}
                    {!answer?.uploaded && takeCount === 0 ? null : statusText}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="space-y-5">
          {/* Question card */}
          <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Câu {currentIndex + 1} / {questions.length}
              </p>
              {aiReading && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                    AI đang đọc câu hỏi...
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      questionAudioRef.current?.pause();
                      questionAudioRef.current = null;
                      setAiReading(false);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Bỏ qua
                  </button>
                </div>
              )}
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-8 text-slate-950 sm:text-2xl sm:leading-10">
              {currentQuestion?.content ?? "Chưa có câu hỏi"}
            </h2>

            {/* Recording controls — 1 hành động chính theo đúng trạng thái */}
            <div className="mt-6">
              {!recording && currentAttempts.length === 0 && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <MicrophoneIcon className="h-5 w-5" />
                  Ghi câu trả lời
                </button>
              )}

              {recording && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-4 text-base font-semibold text-white transition hover:bg-rose-600"
                  >
                    <StopIcon className="h-5 w-5" />
                    Dừng ghi
                  </button>
                  <span className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
                    Đang ghi {formatDuration(durationSeconds)}
                  </span>
                </div>
              )}

              {!recording && currentAttempts.length > 0 && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Ghi lại câu trả lời
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}
          </article>

          {/* Attempts list */}
          {currentAttempts.length > 0 && (
            <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Bản ghi của bạn · {currentAttempts.length} bản
              </h3>

              <div className="mt-4 space-y-3">
                {currentAttempts.map((attempt) => {
                  const isSelected = attempt.id === selectedAttemptId;
                  const confirmingDelete = deleteConfirmId === attempt.id;
                  return (
                    <div
                      key={attempt.id}
                      className={`rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      {confirmingDelete ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Xóa bản ghi này?</p>
                            <p className="text-xs text-slate-500">Bản ghi sẽ không thể khôi phục.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAttempt(attempt.id)}
                              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                            >
                              Xóa bản ghi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-700">Bản ghi {attempt.index}</span>
                              <span className="text-xs text-slate-400">{formatDuration(attempt.durationSeconds)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {attempt.uploadStatus === "uploading" && (
                                <span className="text-xs text-slate-400">Đang lưu...</span>
                              )}
                              {attempt.uploadStatus === "failed" && (
                                <span className="text-xs text-rose-500">Lưu thất bại</span>
                              )}
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                  <CheckCircleSolid className="h-4 w-4" />
                                  Đang chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => selectAttempt(attempt.id)}
                                  className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                  Chọn bản này
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(attempt.id)}
                                disabled={busy}
                                className="rounded-lg p-1.5 text-slate-300 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Xóa bản ghi ${attempt.index}`}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {attempt.objectUrl && (
                            <audio src={attempt.objectUrl} controls className="mt-3 h-9 w-full rounded-xl" />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Phân tích — hành động chính khi chưa có kết quả, phụ khi đã có kết quả */}
              <div className="mt-5 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={analyzeSelectedAttempt}
                  disabled={!selectedAttempt || selectedAttempt.uploadStatus !== "uploaded" || busy || recording}
                  className={`rounded-2xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                    currentAnswer?.uploaded ? "px-4 py-2 text-sm" : "w-full px-5 py-4 text-base sm:w-auto"
                  }`}
                >
                  {busy
                    ? "✨ Đang phân tích câu trả lời..."
                    : currentAnswer?.uploaded
                      ? "✨ Phân tích lại bản đã chọn"
                      : "✨ Phân tích câu trả lời"}
                </button>
                {!currentAnswer?.uploaded && !busy && (
                  <p className="text-xs text-slate-400">AI sẽ đánh giá câu trả lời và đưa ra góp ý cải thiện.</p>
                )}
                {busy && (
                  <p className="text-xs text-indigo-500">
                    AI đang chuyển câu trả lời thành văn bản và đánh giá cách bạn trả lời...
                  </p>
                )}
              </div>
            </article>
          )}

          {/* Bỏ qua câu này — luôn là hành động phụ, chỉ hiện khi chưa có kết quả */}
          {!currentAnswer?.uploaded && (
            <div className="text-center">
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="text-sm text-slate-400 underline-offset-4 transition hover:text-slate-600 hover:underline"
                >
                  Bỏ qua câu này →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishSession}
                  disabled={busy}
                  className="text-sm text-slate-400 underline-offset-4 transition hover:text-slate-600 hover:underline disabled:opacity-50"
                >
                  Bỏ qua, kết thúc buổi →
                </button>
              )}
            </div>
          )}

          {/* Feedback area — after analysis */}
          {currentAnswer?.uploaded && (
            <article className="rounded-[28px] border border-emerald-200 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircleSolid className="h-5 w-5" />
                <h2 className="text-sm font-semibold uppercase tracking-widest">Đã phân tích</h2>
              </div>

              <div className="mt-5 space-y-5">
                {/* Transcript */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">Transcript</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        currentAnswer.transcriptSource === "whisper"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {currentAnswer.transcriptSource === "whisper" ? "Whisper AI" : "Fallback"}
                    </span>
                    {currentAnswer.transcriptFallbackReason && (
                      <span className="text-xs text-amber-600">{currentAnswer.transcriptFallbackReason}</span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    {currentAnswer.transcript}
                  </pre>
                </div>

                {/* Score + strengths + weaknesses */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-slate-400">Điểm</p>
                    <p className="mt-2 text-4xl font-bold text-slate-950">
                      {currentAnswer.feedback?.score ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">/ 100</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Thế mạnh</p>
                    <ul className="space-y-1.5 text-sm text-emerald-900">
                      {(currentAnswer.feedback?.strengths ?? []).map((item) => (
                        <li key={item} className="flex gap-1.5">
                          <span className="flex-shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">Cải thiện</p>
                    <ul className="space-y-1.5 text-sm text-amber-900">
                      {(currentAnswer.feedback?.weaknesses ?? []).map((item) => (
                        <li key={item} className="flex gap-1.5">
                          <span className="flex-shrink-0">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tips */}
                {(currentAnswer.feedback?.tips ?? []).length > 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Gợi ý hành động</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {(currentAnswer.feedback?.tips ?? []).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="flex-shrink-0 text-emerald-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hành động chính tiếp theo, sau khi đã có kết quả */}
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
                  >
                    Câu tiếp theo
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishSession}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {busy ? "Đang tổng hợp..." : "Kết thúc và tạo báo cáo"}
                  </button>
                )}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
