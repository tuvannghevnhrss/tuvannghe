"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import InterviewPageHeader from "@/components/interview/InterviewPageHeader";
import ModuleSwitcher from "@/components/interview/ModuleSwitcher";
import type { InterviewConfig } from "@/lib/m3/schemas";
import { ApiError, m3api, type CvDoc, type InterviewView, type JobDoc, type Message, type Progress } from "./api";
import JobTab from "./JobTab";
import ProfileTab from "./ProfileTab";
import ReportTab from "./ReportTab";
import RoomTab from "./RoomTab";
import SetupTab from "./SetupTab";
import { Alert, Spinner } from "./ui";

type TabKey = "profile" | "job" | "setup" | "room" | "report";
const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Hồ sơ ứng viên" },
  { key: "job", label: "Vị trí ứng tuyển" },
  { key: "setup", label: "Thiết lập phỏng vấn" },
  { key: "room", label: "Phòng phỏng vấn" },
  { key: "report", label: "Báo cáo" },
];

const DEFAULT_CONFIG: InterviewConfig = {
  interview_type: "hiring_manager",
  strictness: "neutral",
  duration_min: 30,
  language: "vi",
  voice: "marin",
  candidate_name: null,
};

type RoomInit = { messages: Message[]; progress: Progress | null; resumed: boolean; startedAt: string | null };

export default function Module3V2Client() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const initialId = sp.get("i");

  const [booting, setBooting] = useState(!!initialId);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("profile");
  const [cv, setCv] = useState<CvDoc | null>(null);
  const [job, setJob] = useState<JobDoc | null>(null);
  const [view, setView] = useState<InterviewView | null>(null);
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_CONFIG);
  const [candidateName, setCandidateName] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [roomInit, setRoomInit] = useState<RoomInit | null>(null);

  const interviewId = view?.interview.id ?? null;
  const status = view?.interview.status ?? null;
  const inProgress = status === "in_progress";
  const completed = status === "completed";
  const locked = inProgress || completed;
  const hasMatch = !!view?.interview.match;
  const evaluation = view?.evaluation ?? null;
  const cvRef = useRef<CvDoc | null>(null);
  cvRef.current = cv;

  const handleAuth = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/signup?redirectedFrom=${encodeURIComponent(pathname)}`);
        return true;
      }
      return false;
    },
    [pathname, router],
  );

  const setUrlId = useCallback(
    (id: string | null) => {
      router.replace(id ? `${pathname}?i=${id}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const reload = useCallback(
    async (id: string) => {
      const v = await m3api.getInterview(id);
      setView(v);
      setConfig(v.interview.config);
      return v;
    },
    [],
  );

  /* ── Khôi phục buổi phỏng vấn từ ?i= ── */
  useEffect(() => {
    if (!initialId) return;
    let cancelled = false;
    (async () => {
      try {
        const v = await reload(initialId);
        if (cancelled) return;
        setCandidateName(v.interview.config.candidate_name ?? "");
        const [c, j] = await Promise.all([
          v.cv ? m3api.getDocument(v.cv.id).then((r) => r.document).catch(() => null) : null,
          v.jd ? m3api.getJob(v.jd.id).then((r) => r.job).catch(() => null) : null,
        ]);
        if (cancelled) return;
        setCv(c);
        setJob(j);
        const st = v.interview.status;
        if (st === "completed") setTab("report");
        else if (st === "in_progress") {
          const s = await m3api.start(initialId);
          if (cancelled) return;
          setRoomInit({ messages: s.messages, progress: s.progress, resumed: true, startedAt: s.started_at });
          setTab("room");
        } else if (st === "planned") setTab("setup");
        else if (v.interview.match) setTab("setup");
        else setTab("job");
      } catch (err) {
        if (!handleAuth(err)) setGlobalError(err instanceof ApiError ? err.message : "Không tải được buổi phỏng vấn.");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  /* ── Đổi CV/JD khi chưa bắt đầu → bỏ buổi nháp cũ ── */
  const discardDraft = useCallback(async () => {
    if (view && !locked) {
      await m3api.deleteInterview(view.interview.id).catch(() => undefined);
      setView(null);
      setUrlId(null);
    }
  }, [locked, setUrlId, view]);

  const onCv = useCallback(
    async (next: CvDoc | null) => {
      if (locked) return;
      if (cvRef.current?.id !== next?.id) await discardDraft();
      setCv(next);
    },
    [discardDraft, locked],
  );
  const onJob = useCallback(
    async (next: JobDoc | null) => {
      if (locked) return;
      if (job?.id !== next?.id) await discardDraft();
      setJob(next);
    },
    [discardDraft, job?.id, locked],
  );

  const cfgWithName = useMemo<InterviewConfig>(() => ({ ...config, candidate_name: candidateName.trim() || null }), [config, candidateName]);

  async function runMatch() {
    if (!cv || !job) return;
    setMatching(true);
    setMatchError(null);
    try {
      if (view && !locked) await discardDraft();
      const { interview_id } = await m3api.createInterview(cv.id, job.id, cfgWithName);
      await reload(interview_id);
      setUrlId(interview_id);
    } catch (err) {
      if (!handleAuth(err)) setMatchError(err instanceof ApiError ? err.message : "Không đối chiếu được CV với JD.");
    } finally {
      setMatching(false);
    }
  }

  async function runPlan() {
    if (!interviewId) return;
    setPlanning(true);
    setPlanError(null);
    try {
      await m3api.createPlan(interviewId, cfgWithName);
      await reload(interviewId);
    } catch (err) {
      if (!handleAuth(err)) setPlanError(err instanceof ApiError ? err.message : "Không lập được kế hoạch.");
    } finally {
      setPlanning(false);
    }
  }

  async function startInterview() {
    if (!interviewId) return;
    setStarting(true);
    setStartError(null);
    try {
      const s = await m3api.start(interviewId);
      setRoomInit({ messages: s.messages, progress: s.progress, resumed: s.resumed, startedAt: s.started_at });
      await reload(interviewId);
      setTab("room");
    } catch (err) {
      if (handleAuth(err)) return;
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        router.push("/pricing?reason=quota");
        return;
      }
      setStartError(err instanceof ApiError ? err.message : "Không bắt đầu được buổi phỏng vấn.");
    } finally {
      setStarting(false);
    }
  }

  async function onFinished() {
    if (!interviewId) return;
    try {
      await reload(interviewId);
    } finally {
      setTab("report");
    }
  }

  const tabEnabled: Record<TabKey, boolean> = {
    profile: true,
    job: true,
    setup: hasMatch,
    room: inProgress && !!roomInit,
    report: !!evaluation,
  };

  if (booting) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner label="Đang tải buổi phỏng vấn…" /></div>;
  }

  return (
    <div className="space-y-5">
      <InterviewPageHeader
        eyebrow="Module 3 · Phiên bản 2"
        title="Phỏng vấn AI theo CV và yêu cầu công việc"
        description="Tải CV, nhập JD, AI lập kế hoạch rồi phỏng vấn bạn bằng giọng nói: biết đào sâu khi trả lời chung chung, đối chiếu với CV và chấm điểm theo năng lực của vị trí."
      />
      <ModuleSwitcher />
      <p className="text-sm text-slate-500">
        Muốn dùng bản cũ? <Link href="/interview/module-3" className="font-medium text-emerald-700 underline">Quay lại Module 3 cổ điển</Link>
      </p>

      <nav aria-label="Các bước" className="-mx-1 overflow-x-auto pb-1">
        <ol className="flex min-w-max gap-2 px-1">
          {TABS.map((t, i) => {
            const active = tab === t.key;
            const enabled = tabEnabled[t.key];
            return (
              <li key={t.key}>
                <button
                  type="button"
                  disabled={!enabled}
                  aria-current={active ? "step" : undefined}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                    active ? "border-emerald-600 bg-emerald-600 text-white" : enabled ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${active ? "bg-white/25" : "bg-slate-200 text-slate-600"}`}>{i + 1}</span>
                  {t.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {globalError && <Alert>{globalError}</Alert>}
      {completed && tab !== "report" && <Alert tone="emerald">Buổi phỏng vấn này đã hoàn thành. Xem tab “Báo cáo” để biết kết quả, hoặc <button className="font-semibold underline" onClick={() => { setView(null); setRoomInit(null); setCv(null); setJob(null); setUrlId(null); setTab("profile"); }}>tạo buổi mới</button>.</Alert>}

      {tab === "profile" && <ProfileTab cv={cv} onCv={onCv} candidateName={candidateName} onCandidateName={setCandidateName} locked={locked} onNext={() => setTab("job")} />}
      {tab === "job" && (
        <JobTab cv={cv} job={job} onJob={onJob} match={view?.interview.match ?? null} matching={matching} matchError={matchError} onMatch={runMatch} locked={locked} onNext={() => setTab("setup")} />
      )}
      {tab === "setup" && (
        <SetupTab
          ready={hasMatch}
          config={cfgWithName}
          onConfig={(c) => setConfig(c)}
          plan={view?.interview.plan ?? null}
          planning={planning}
          planError={planError}
          onPlan={runPlan}
          onStart={() => (inProgress && roomInit ? setTab("room") : void startInterview())}
          starting={starting}
          startError={startError}
          inProgress={inProgress}
        />
      )}
      {tab === "room" && interviewId && roomInit && (
        <RoomTab
          key={interviewId}
          interviewId={interviewId}
          config={view?.interview.config ?? cfgWithName}
          initialMessages={roomInit.messages}
          initialProgress={roomInit.progress}
          resumed={roomInit.resumed}
          startedAt={roomInit.startedAt}
          onFinished={onFinished}
        />
      )}
      {tab === "report" && <ReportTab report={evaluation?.report ?? null} candidateName={cv?.parsed?.basics.full_name ?? candidateName} jobTitle={job?.title ?? view?.jd?.title ?? ""} />}
    </div>
  );
}
