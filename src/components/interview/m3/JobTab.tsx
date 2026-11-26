"use client";

import { useEffect, useState } from "react";
import type { MatchResult } from "@/lib/m3/schemas";
import { ApiError, m3api, type CvDoc, type JobDoc } from "./api";
import { Alert, btnDanger, btnPrimary, btnSecondary, Card, Chip, Field, inputCls, Spinner } from "./ui";

type Props = {
  cv: CvDoc | null;
  job: JobDoc | null;
  onJob: (j: JobDoc | null) => void;
  match: MatchResult | null;
  matching: boolean;
  matchError: string | null;
  onMatch: () => void;
  locked: boolean;
  onNext: () => void;
};

const SENIORITY: Record<string, string> = {
  intern: "Thực tập", junior: "Junior", mid: "Mid-level", senior: "Senior", lead: "Lead", manager: "Quản lý", director: "Giám đốc", unknown: "Chưa rõ",
};

export default function JobTab({ cv, job, onJob, match, matching, matchError, onMatch, locked, onNext }: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<JobDoc[]>([]);

  useEffect(() => {
    m3api.listJobs().then((r) => setRecent(r.jobs.filter((j) => j.status === "ready"))).catch(() => undefined);
  }, [job?.id]);

  async function analyze() {
    setError(null);
    if (title.trim().length < 2) return setError("Hãy nhập tên vị trí ứng tuyển.");
    if (text.trim().length < 80) return setError("JD quá ngắn. Hãy dán nội dung mô tả công việc (ít nhất vài dòng).");
    setBusy(true);
    try {
      const { job: j } = await m3api.createJob(title.trim(), text);
      onJob(j);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không phân tích được JD.");
    } finally {
      setBusy(false);
    }
  }

  async function removeJob() {
    if (!job || !window.confirm("Xóa JD này và các buổi phỏng vấn tạo từ JD này?")) return;
    setBusy(true);
    try {
      await m3api.deleteJob(job.id);
      onJob(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xóa được JD.");
    } finally {
      setBusy(false);
    }
  }

  const p = job?.parsed;

  return (
    <div className="space-y-5">
      {!job && (
        <Card title="Vị trí ứng tuyển" subtitle="Dán mô tả công việc (JD). Càng đầy đủ, câu hỏi càng sát yêu cầu thật.">
          <div className="space-y-4">
            <Field label="Tên vị trí">
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ví dụ: Chuyên viên Tuyển dụng" />
            </Field>
            <Field label="Mô tả công việc (JD)" hint={`${text.length.toLocaleString("vi-VN")} / 12.000 ký tự — JD tiếng Việt hoặc tiếng Anh đều được.`}>
              <textarea className={`${inputCls} min-h-[220px] resize-y`} value={text} onChange={(e) => setText(e.target.value.slice(0, 12000))} placeholder="Trách nhiệm, yêu cầu bắt buộc, yêu cầu ưu tiên…" />
            </Field>
            {error && <Alert>{error}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <button className={btnPrimary} onClick={analyze} disabled={busy}>Phân tích JD</button>
              {busy && <Spinner label="Đang phân tích JD…" />}
            </div>
            {recent.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Hoặc dùng JD đã nhập trước đó</p>
                <ul className="space-y-2">
                  {recent.slice(0, 4).map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate">{j.title}</span>
                      <button className={btnSecondary} onClick={() => onJob(j)}>Dùng JD này</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {job && p && (
        <Card
          title={`JD đã phân tích: ${job.title}`}
          right={
            <div className="flex gap-2">
              <button className={btnSecondary} disabled={busy || locked} onClick={() => onJob(null)}>Đổi JD</button>
              <button className={btnDanger} disabled={busy || locked} onClick={removeJob}>Xóa JD</button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Chip tone="indigo">Cấp bậc: {SENIORITY[p.seniority] ?? p.seniority}</Chip>
            {p.years_experience_min != null && <Chip>Tối thiểu {p.years_experience_min} năm kinh nghiệm</Chip>}
            <Chip>Ngôn ngữ: {p.language === "vi" ? "Tiếng Việt" : "English"}</Chip>
          </div>
          {job.injection?.flagged && <div className="mt-4"><Alert tone="amber">JD có đoạn giống chỉ dẫn dành cho AI; hệ thống đã bỏ qua đoạn này.</Alert></div>}
          {error && <div className="mt-4"><Alert>{error}</Alert></div>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Yêu cầu bắt buộc</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {p.must_have.length ? p.must_have.map((m) => <li key={m.id}>{m.text}</li>) : <li className="list-none text-slate-400">JD chưa nêu rõ</li>}
              </ul>
              {p.nice_to_have.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Ưu tiên</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{p.nice_to_have.map((m) => <li key={m.id}>{m.text}</li>)}</ul>
                </>
              )}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Năng lực cốt lõi sẽ được kiểm tra</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {p.core_competencies.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-slate-900">{c.name}</span> <Chip tone="emerald">mức {c.weight_hint}/5</Chip>
                    <span className="block text-slate-500">{c.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {p.missing_info.length > 0 && (
            <div className="mt-4"><Alert tone="amber">JD còn thiếu: {p.missing_info.join("; ")}. AI sẽ chỉ dựa vào phần JD có sẵn.</Alert></div>
          )}
        </Card>
      )}

      {job && (
        <Card title="Đối chiếu CV – JD" subtitle="Xác định điểm phù hợp, khoảng trống và những điểm AI cần xác minh khi phỏng vấn.">
          {!cv && <Alert tone="amber">Hãy tải CV ở tab “Hồ sơ ứng viên” trước khi đối chiếu.</Alert>}
          {cv && !match && (
            <div className="flex flex-wrap items-center gap-3">
              <button className={btnPrimary} onClick={onMatch} disabled={matching}>Đối chiếu CV với JD</button>
              {matching && <Spinner label="Đang đối chiếu (khoảng 10–20 giây)…" />}
            </div>
          )}
          {matchError && <div className="mt-3"><Alert>{matchError}</Alert></div>}
          {match && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-emerald-500 text-slate-900">
                  <span className="text-2xl font-bold">{match.overall_fit}</span>
                  <span className="text-[10px] uppercase text-slate-500">ước lượng</span>
                </div>
                <p className="max-w-2xl text-sm text-slate-700">{match.summary}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-900">A. Điểm phù hợp ({match.strengths.length})</p>
                  <ul className="mt-2 space-y-3 text-sm text-slate-700">
                    {match.strengths.map((s, i) => (
                      <li key={i}>
                        <span>{s.explanation}</span>
                        {s.cv_quote && <span className="mt-1 block text-xs italic text-slate-500">CV: “{s.cv_quote}”</span>}
                        {s.jd_quote && <span className="block text-xs italic text-slate-500">JD: “{s.jd_quote}”</span>}
                      </li>
                    ))}
                    {!match.strengths.length && <li className="text-slate-400">Chưa tìm thấy điểm khớp rõ ràng.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="text-sm font-semibold text-rose-900">B. Khoảng trống ({match.gaps.length})</p>
                  <ul className="mt-2 space-y-3 text-sm text-slate-700">
                    {match.gaps.map((g, i) => (
                      <li key={i}>
                        <Chip tone={g.severity === "high" ? "rose" : g.severity === "medium" ? "amber" : "slate"}>{g.severity === "high" ? "quan trọng" : g.severity === "medium" ? "vừa" : "nhẹ"}</Chip>{" "}
                        {g.explanation}
                        {g.jd_quote && <span className="mt-1 block text-xs italic text-slate-500">JD: “{g.jd_quote}”</span>}
                      </li>
                    ))}
                    {!match.gaps.length && <li className="text-slate-400">Không phát hiện khoảng trống đáng kể.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-semibold text-amber-900">C. Cần xác minh ({match.to_verify.length})</p>
                  <ul className="mt-2 space-y-3 text-sm text-slate-700">
                    {match.to_verify.map((v, i) => (
                      <li key={i}>
                        {v.detail}
                        {v.cv_quote && <span className="mt-1 block text-xs italic text-slate-500">CV: “{v.cv_quote}”</span>}
                      </li>
                    ))}
                    {!match.to_verify.length && <li className="text-slate-400">Không có điểm cần xác minh thêm.</li>}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end">
                <button className={btnPrimary} onClick={onNext}>Tiếp tục: thiết lập buổi phỏng vấn →</button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
