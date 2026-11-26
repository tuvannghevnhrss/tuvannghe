"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, m3api, type CvDoc } from "./api";
import { Alert, btnDanger, btnPrimary, btnSecondary, Card, Chip, inputCls, Field, Spinner } from "./ui";

type Props = {
  cv: CvDoc | null;
  onCv: (cv: CvDoc | null) => void;
  candidateName: string;
  onCandidateName: (v: string) => void;
  locked: boolean;
  onNext: () => void;
};

export default function ProfileTab({ cv, onCv, candidateName, onCandidateName, locked, onNext }: Props) {
  const [consent, setConsent] = useState(false);
  const [storeOriginal, setStoreOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<CvDoc[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    m3api
      .listDocuments()
      .then((r) => setRecent(r.documents.filter((d) => d.status === "ready")))
      .catch(() => undefined);
  }, [cv?.id]);

  async function upload(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    if (!consent) {
      setError("Vui lòng tích đồng ý cho hệ thống xử lý CV trước khi tải lên.");
      return;
    }
    setBusy(true);
    try {
      const { document } = await m3api.uploadCv(file, storeOriginal);
      onCv(document);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được CV.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove() {
    if (!cv) return;
    if (!window.confirm("Xóa CV này? File gốc (nếu có), dữ liệu phân tích và các buổi phỏng vấn tạo từ CV này sẽ bị xóa.")) return;
    setBusy(true);
    setError(null);
    try {
      await m3api.deleteDocument(cv.id);
      onCv(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xóa được CV.");
    } finally {
      setBusy(false);
    }
  }

  const p = cv?.parsed;

  return (
    <div className="space-y-5">
      {!cv && (
        <Card title="Tải lên CV" subtitle="Hỗ trợ PDF hoặc DOCX, tối đa 5 MB. AI sẽ đọc nội dung thật của CV để tạo câu hỏi sát với bạn.">
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span>
                Tôi đồng ý cho hệ thống đọc và phân tích CV của tôi bằng AI (nội dung được gửi tới nhà cung cấp AI để xử lý) nhằm tạo buổi phỏng vấn thử.
                Dữ liệu tự động hết hạn sau 30 ngày và tôi có thể xóa bất cứ lúc nào. Xem{" "}
                <a href="/privacy" target="_blank" className="font-medium text-emerald-700 underline">Chính sách bảo mật</a>.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={storeOriginal} onChange={(e) => setStoreOriginal(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span>Lưu thêm file gốc để xem lại sau (mặc định: không lưu file gốc, chỉ giữ dữ liệu đã phân tích).</span>
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void upload(e.dataTransfer.files?.[0]);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white"
              }`}
            >
              {busy ? (
                <Spinner label="Đang đọc và phân tích CV (khoảng 10–20 giây)…" />
              ) : (
                <>
                  <p className="text-sm text-slate-600">Kéo thả file CV vào đây hoặc</p>
                  <button type="button" className={btnPrimary} onClick={() => fileRef.current?.click()} disabled={!consent}>
                    Chọn file CV
                  </button>
                  {!consent && <p className="text-xs text-slate-400">Hãy tích đồng ý ở trên để bật nút tải lên.</p>}
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </div>
            {error && <Alert>{error}</Alert>}

            {recent.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Hoặc dùng CV đã tải trước đó</p>
                <ul className="space-y-2">
                  {recent.slice(0, 4).map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                      <span className="min-w-0 truncate">{d.file_name}</span>
                      <button className={btnSecondary} onClick={() => onCv(d)}>Dùng CV này</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {cv && p && (
        <>
          <Card
            title="CV đã phân tích"
            subtitle={`${cv.file_name} · ${(cv.file_size / 1024).toFixed(0)} KB · ${cv.file_kind.toUpperCase()}`}
            right={
              <div className="flex gap-2">
                <button className={btnSecondary} disabled={busy || locked} onClick={() => onCv(null)}>Thay CV</button>
                <button className={btnDanger} disabled={busy || locked} onClick={remove}>Xóa CV</button>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="emerald">Đã phân tích</Chip>
              <Chip>{cv.stored_original ? "Có lưu file gốc" : "Không lưu file gốc"}</Chip>
              {p.language && <Chip tone="indigo">Ngôn ngữ: {p.language === "vi" ? "Tiếng Việt" : "English"}</Chip>}
              <Chip>Hết hạn: {new Date(cv.expires_at).toLocaleDateString("vi-VN")}</Chip>
            </div>
            {cv.injection?.flagged && (
              <div className="mt-4">
                <Alert tone="amber">CV có đoạn giống chỉ dẫn dành cho AI. Hệ thống xem đó là nội dung thông thường và bỏ qua; bạn nên kiểm tra lại CV.</Alert>
              </div>
            )}
            {error && <div className="mt-4"><Alert>{error}</Alert></div>}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin cơ bản</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{p.basics.full_name ?? "Chưa có tên trong CV"}</p>
                <p className="text-sm text-slate-600">{p.basics.headline ?? "Chưa có tiêu đề nghề nghiệp"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Tổng kinh nghiệm: {p.basics.years_experience_total != null ? `${p.basics.years_experience_total} năm` : "chưa rõ"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Học vấn & chứng chỉ</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {p.education.length ? p.education.map((e, i) => <li key={i}>{[e.degree, e.field, e.institution].filter(Boolean).join(" · ")}{e.period ? ` (${e.period})` : ""}</li>) : <li className="text-slate-400">Chưa có thông tin</li>}
                  {p.certifications.map((c, i) => <li key={`c${i}`}>🏅 {c.name}{c.year ? ` (${c.year})` : ""}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-900">Kinh nghiệm làm việc</p>
              <div className="mt-3 space-y-3">
                {p.experience.length === 0 && <p className="text-sm text-slate-400">Chưa trích xuất được kinh nghiệm làm việc.</p>}
                {p.experience.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{e.title ?? "Chưa rõ chức danh"} · {e.company}</p>
                      <span className="text-xs text-slate-500">{e.period_raw ?? "chưa rõ thời gian"}</span>
                    </div>
                    {e.achievements.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {e.achievements.slice(0, 4).map((a, i) => (
                          <li key={i}>
                            {a.text} {a.is_quantified ? <Chip tone="emerald">có số liệu</Chip> : <Chip tone="amber">chưa có số liệu</Chip>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.personal_role_clarity !== "clear" && (
                      <p className="mt-2 text-xs text-amber-700">Vai trò cá nhân {e.personal_role_clarity === "vague" ? "mô tả còn chung chung" : "chưa được mô tả"} — AI sẽ hỏi làm rõ.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-900">Kỹ năng</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.skills.slice(0, 40).map((s, i) => (
                  <Chip key={i} tone={s.evidence === "explicit" ? "slate" : "amber"}>
                    {s.name}{s.evidence === "inferred" ? " (suy luận)" : ""}
                  </Chip>
                ))}
                {p.skills.length === 0 && <span className="text-sm text-slate-400">Chưa trích xuất được kỹ năng</span>}
              </div>
            </div>

            {(p.data_quality.timeline_gaps.length > 0 || p.data_quality.missing_sections.length > 0 || p.data_quality.notes.length > 0) && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Điểm AI sẽ lưu ý khi phỏng vấn</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {p.data_quality.timeline_gaps.map((g, i) => <li key={`g${i}`}>{g.note}</li>)}
                  {p.data_quality.missing_sections.map((m, i) => <li key={`m${i}`}>CV thiếu mục: {m}</li>)}
                  {p.data_quality.notes.map((n, i) => <li key={`n${i}`}>{n}</li>)}
                </ul>
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Mọi thông tin trên được trích từ CV của bạn; mục ghi “suy luận” là AI suy đoán và có thể chưa chính xác. Email, số điện thoại không được lưu.
            </p>
          </Card>

          <Card title="Thông tin buổi phỏng vấn">
            <div className="max-w-md">
              <Field label="Tên hiển thị của bạn (tùy chọn)" hint="AI sẽ gọi bạn bằng tên này ở lời chào.">
                <input className={inputCls} value={candidateName} onChange={(e) => onCandidateName(e.target.value)} maxLength={60} placeholder={p.basics.full_name ?? "Ví dụ: Hà"} disabled={locked} />
              </Field>
            </div>
          </Card>

          <div className="flex justify-end">
            <button className={btnPrimary} onClick={onNext}>Tiếp tục: nhập vị trí ứng tuyển →</button>
          </div>
        </>
      )}
      {!cv && error === null && null}
    </div>
  );
}
