"use client";

import { DURATIONS_MIN, REALTIME_VOICES, turnBudgetForDuration } from "@/lib/m3/config";
import type { InterviewConfig } from "@/lib/m3/schemas";
import type { InterviewView } from "./api";
import { Alert, btnPrimary, btnSecondary, Card, Chip, Field, inputCls, Spinner } from "./ui";

type Props = {
  ready: boolean; // đã có CV + JD + đối chiếu
  config: InterviewConfig;
  onConfig: (c: InterviewConfig) => void;
  plan: InterviewView["interview"]["plan"];
  planning: boolean;
  planError: string | null;
  onPlan: () => void;
  onStart: () => void;
  starting: boolean;
  startError: string | null;
  inProgress: boolean;
};

const TYPE_OPTIONS: { v: InterviewConfig["interview_type"]; label: string; desc: string }[] = [
  { v: "hr_screening", label: "HR Screening", desc: "Sàng lọc ban đầu: động lực, phù hợp văn hóa, xác minh CV" },
  { v: "hiring_manager", label: "Hiring Manager", desc: "Trao đổi với quản lý: kết quả, quyết định, cách làm việc" },
  { v: "technical", label: "Technical Interview", desc: "Chuyên môn sâu, giải quyết vấn đề, tình huống thực tế" },
  { v: "behavioral", label: "Behavioral Interview", desc: "Câu hỏi hành vi theo STAR" },
];
const STRICT_OPTIONS: { v: InterviewConfig["strictness"]; label: string; desc: string }[] = [
  { v: "friendly", label: "Thân thiện", desc: "Khích lệ, ít chất vấn" },
  { v: "neutral", label: "Trung tính", desc: "Cân bằng, đào sâu khi cần" },
  { v: "strict", label: "Nghiêm khắc", desc: "Đòi số liệu, chất vấn mâu thuẫn" },
];
const VOICE_LABEL: Record<string, string> = { marin: "Marin — nữ, tự nhiên", cedar: "Cedar — nam, trầm", alloy: "Alloy — trung tính", shimmer: "Shimmer — nữ, nhẹ", verse: "Verse — nam, linh hoạt" };
const SOURCE_LABEL: Record<string, string> = { jd: "Từ JD", cv_gap: "Khoảng trống CV", cv_verify: "Cần xác minh", general: "Chung" };

export default function SetupTab({ ready, config, onConfig, plan, planning, planError, onPlan, onStart, starting, startError, inProgress }: Props) {
  const set = <K extends keyof InterviewConfig>(k: K, v: InterviewConfig[K]) => onConfig({ ...config, [k]: v });
  const budget = turnBudgetForDuration(config.duration_min);

  if (!ready) {
    return <Alert tone="amber">Hãy hoàn thành “Hồ sơ ứng viên” và “Vị trí ứng tuyển” (kèm đối chiếu CV – JD) trước khi thiết lập buổi phỏng vấn.</Alert>;
  }

  return (
    <div className="space-y-5">
      <Card title="Cấu hình phỏng vấn">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Loại phỏng vấn</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TYPE_OPTIONS.map((o) => (
                <button key={o.v} type="button" disabled={inProgress} onClick={() => set("interview_type", o.v)} className={`rounded-2xl border p-4 text-left transition ${config.interview_type === o.v ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <span className="block text-sm font-semibold text-slate-900">{o.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Mức độ nghiêm khắc</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {STRICT_OPTIONS.map((o) => (
                <button key={o.v} type="button" disabled={inProgress} onClick={() => set("strictness", o.v)} className={`rounded-2xl border p-4 text-left transition ${config.strictness === o.v ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <span className="block text-sm font-semibold text-slate-900">{o.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Thời lượng" hint={`Khoảng ${budget} câu hỏi chính`}>
              <select className={inputCls} value={config.duration_min} disabled={inProgress} onChange={(e) => set("duration_min", Number(e.target.value))}>
                {DURATIONS_MIN.map((d) => <option key={d} value={d}>{d} phút</option>)}
              </select>
            </Field>
            <Field label="Ngôn ngữ phỏng vấn">
              <select className={inputCls} value={config.language} disabled={inProgress} onChange={(e) => set("language", e.target.value as "vi" | "en")}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Giọng AI">
              <select className={inputCls} value={config.voice} disabled={inProgress} onChange={(e) => set("voice", e.target.value)}>
                {REALTIME_VOICES.map((v) => <option key={v} value={v}>{VOICE_LABEL[v] ?? v}</option>)}
              </select>
            </Field>
          </div>
          {planError && <Alert>{planError}</Alert>}
          {!inProgress && (
            <div className="flex flex-wrap items-center gap-3">
              <button className={plan ? btnSecondary : btnPrimary} onClick={onPlan} disabled={planning}>{plan ? "Lập lại kế hoạch với cấu hình này" : "Lập kế hoạch phỏng vấn"}</button>
              {planning && <Spinner label="AI đang lập kế hoạch (khoảng 15–30 giây)…" />}
            </div>
          )}
        </div>
      </Card>

      {plan && (
        <Card title="Kế hoạch phỏng vấn" subtitle={plan.summary}>
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-900">Năng lực sẽ được kiểm tra (trọng số theo JD)</p>
              <ul className="space-y-3">
                {plan.competencies.map((c) => (
                  <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <div className="flex items-center gap-2"><Chip tone="indigo">{SOURCE_LABEL[c.source] ?? c.source}</Chip><span className="text-sm font-semibold text-slate-700">{Math.round(c.weight * 100)}%</span></div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, c.weight * 100 * 3)}%` }} /></div>
                    <p className="mt-2 text-sm text-slate-600">{c.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-900">Các chặng phỏng vấn</p>
              <ol className="space-y-3">
                {plan.stages.map((s, i) => (
                  <li key={s.id} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{s.name} <span className="font-normal text-slate-500">· {s.planned_turns} lượt</span></p>
                      <p className="mt-1 text-sm text-slate-600">{s.objective}</p>
                      {s.evidence_needed.length > 0 && <p className="mt-1 text-xs text-slate-500">Bằng chứng cần thu thập: {s.evidence_needed.join("; ")}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-slate-500">Câu hỏi cụ thể được giữ kín để buổi luyện tập giống thật; AI sẽ điều chỉnh theo câu trả lời của bạn.</p>
            </div>
            {startError && <Alert>{startError}</Alert>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Bắt đầu sẽ tính 1 lượt Module 3 trong gói của bạn. Cần micro; nên dùng tai nghe để tránh vọng tiếng.</p>
              <button className={btnPrimary} disabled={starting} onClick={onStart}>{inProgress ? "Vào phòng phỏng vấn" : "Bắt đầu phỏng vấn"} →</button>
            </div>
            {starting && <Spinner label="Đang chuẩn bị phòng phỏng vấn…" />}
          </div>
        </Card>
      )}
    </div>
  );
}
