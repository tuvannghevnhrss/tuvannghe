/** Client helper cho /api/interview/m3/* (chạy trong trình duyệt). */
import type { InterviewReport } from "@/lib/m3/evaluator";
import type { InterviewConfig, InterviewPlan, MatchResult, ParsedCv, ParsedJd } from "@/lib/m3/schemas";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiError(0, "NETWORK", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string } & Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, data.error ?? "ERROR", data.message ?? `Lỗi ${res.status}`);
  return data as T;
}

const JSON_HEADERS = { "Content-Type": "application/json" };
const BASE = "/api/interview/m3";

export type CvDoc = {
  id: string;
  file_name: string;
  file_size: number;
  file_kind: "pdf" | "docx";
  stored_original: boolean;
  language: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  parsed: ParsedCv | null;
  injection?: { flagged?: boolean; matches?: string[]; dropped_quotes?: number };
};
export type JobDoc = {
  id: string;
  title: string;
  language: string | null;
  status: string;
  created_at: string;
  parsed: ParsedJd | null;
  injection?: { flagged?: boolean; matches?: string[]; dropped_quotes?: number };
};
export type Progress = { turn: number; budget: number; percent: number; stage: string; done: boolean };
export type CoverageRow = { id: string; name: string; weight: number; target: number; collected: number; avg_strength: number; enough: boolean };
export type Message = { turn_index: number; role: "interviewer" | "candidate"; content: string; meta?: Record<string, unknown> | null };

export type InterviewView = {
  interview: {
    id: string;
    status: "draft" | "planned" | "in_progress" | "completed" | "abandoned" | "failed";
    config: InterviewConfig;
    match: MatchResult | null;
    plan: (Omit<InterviewPlan, "stages"> & { stages: Omit<InterviewPlan["stages"][number], "seed_questions">[] }) | null;
    started_at: string | null;
    ended_at: string | null;
    progress: Progress | null;
    coverage: CoverageRow[] | null;
  };
  cv: { id: string; file_name: string; language: string | null } | null;
  jd: { id: string; title: string; language: string | null } | null;
  messages: Message[];
  evaluation: { overall_score: number; recommendation: string; report: InterviewReport } | null;
};

export const m3api = {
  listDocuments: () => call<{ documents: CvDoc[] }>(`${BASE}/documents`),
  getDocument: (id: string) => call<{ document: CvDoc }>(`${BASE}/documents/${id}`),
  uploadCv: (file: File, storeOriginal: boolean) => {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("consent", "true");
    fd.set("store_original", String(storeOriginal));
    return call<{ document: CvDoc }>(`${BASE}/documents`, { method: "POST", body: fd });
  },
  deleteDocument: (id: string) => call<{ deleted: boolean }>(`${BASE}/documents/${id}`, { method: "DELETE" }),

  listJobs: () => call<{ jobs: JobDoc[] }>(`${BASE}/jobs`),
  getJob: (id: string) => call<{ job: JobDoc }>(`${BASE}/jobs/${id}`),
  createJob: (title: string, text: string) =>
    call<{ job: JobDoc }>(`${BASE}/jobs`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title, text }) }),
  deleteJob: (id: string) => call<{ deleted: boolean }>(`${BASE}/jobs/${id}`, { method: "DELETE" }),

  createInterview: (cv_id: string, jd_id: string, config?: Partial<InterviewConfig>) =>
    call<{ interview_id: string }>(`${BASE}/interviews`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ cv_id, jd_id, config }) }),
  getInterview: (id: string) => call<InterviewView>(`${BASE}/interviews/${id}`),
  deleteInterview: (id: string) => call<{ deleted: boolean }>(`${BASE}/interviews/${id}`, { method: "DELETE" }),
  createPlan: (id: string, config: Partial<InterviewConfig>) =>
    call<{ plan: InterviewPlan; config: InterviewConfig }>(`${BASE}/interviews/${id}/plan`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ config }) }),
  start: (id: string) =>
    call<{ resumed: boolean; question: string; turn_index: number; done: boolean; messages: Message[]; progress: Progress; started_at: string; config: InterviewConfig }>(
      `${BASE}/interviews/${id}/start`,
      { method: "POST" },
    ),
  realtimeToken: (id: string) => call<{ client_secret: string; model: string }>(`${BASE}/interviews/${id}/realtime`, { method: "POST" }),
  turn: (id: string, body: { answer: string; via: "realtime" | "text"; duration_sec?: number; want_audio?: boolean }) =>
    call<TurnResponse>(`${BASE}/interviews/${id}/turn`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body) }),
  turnAudio: (id: string, audio: Blob, durationSec: number) => {
    const fd = new FormData();
    fd.set("audio", new File([audio], "answer.webm", { type: audio.type || "audio/webm" }));
    fd.set("duration_sec", String(durationSec));
    return call<TurnResponse>(`${BASE}/interviews/${id}/turn`, { method: "POST", body: fd });
  },
  complete: (id: string) =>
    call<{ report: InterviewReport; overall_score: number; recommendation: string }>(`${BASE}/interviews/${id}/complete`, { method: "POST" }),
};

export type TurnResponse = {
  question: string;
  action: string;
  done: boolean;
  counted: boolean;
  progress: Progress;
  transcript?: string;
  turn_index?: number;
  replay?: boolean;
  audio_base64?: string | null;
  audio_mime?: string;
};

export const RECOMMENDATION_LABEL: Record<string, { label: string; tone: string }> = {
  highly_recommended: { label: "Highly Recommended", tone: "bg-emerald-600 text-white" },
  recommended: { label: "Recommended", tone: "bg-emerald-100 text-emerald-800" },
  consider: { label: "Consider", tone: "bg-amber-100 text-amber-800" },
  not_recommended: { label: "Not Recommended", tone: "bg-rose-100 text-rose-800" },
};
