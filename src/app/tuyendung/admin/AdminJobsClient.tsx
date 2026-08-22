"use client";

import { useEffect, useState } from "react";
import type { JobPosting, JobStatus } from "@/lib/jobs";
import { EMPLOYMENT_TYPE_OPTIONS, formatJobDate } from "@/lib/jobs";

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  employment_type: "full_time" as JobPosting["employment_type"],
  category: "",
  level: "",
  salary_display: "",
  description: "",
  requirements: "",
  benefits: "",
  contact_email: "",
  apply_url: "",
  status: "draft" as JobStatus,
  deadline: "",
};

type FormState = typeof EMPTY_FORM;

export default function AdminJobsClient({ basePath }: { basePath: string }) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await fetch(basePath);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Không tải được danh sách tin");
      setJobs(body.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách tin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function startEdit(job: JobPosting) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      employment_type: job.employment_type,
      category: job.category,
      level: job.level ?? "",
      salary_display: job.salary_display ?? "",
      description: job.description,
      requirements: job.requirements ?? "",
      benefits: job.benefits ?? "",
      contact_email: job.contact_email ?? "",
      apply_url: job.apply_url ?? "",
      status: job.status,
      deadline: job.deadline ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `${basePath}/${editingId}` : basePath, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Lưu tin thất bại");
      resetForm();
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu tin thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(job: JobPosting, status: JobStatus) {
    setError(null);
    try {
      const res = await fetch(`${basePath}/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Cập nhật trạng thái thất bại");
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
    }
  }

  async function handleDelete(job: JobPosting) {
    if (!window.confirm(`Xoá tin "${job.title}"? Không thể hoàn tác.`)) return;
    setError(null);
    try {
      const res = await fetch(`${basePath}/${job.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Xoá tin thất bại");
      if (editingId === job.id) resetForm();
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá tin thất bại");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">
            {editingId ? "Chỉnh sửa tin" : "Đăng tin mới"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Huỷ chỉnh sửa
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vị trí tuyển dụng *">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="fieldInput"
            />
          </Field>
          <Field label="Công ty *">
            <input
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="fieldInput"
            />
          </Field>
          <Field label="Địa điểm">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Toàn quốc"
              className="fieldInput"
            />
          </Field>
          <Field label="Ngành nghề">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Marketing, IT, Kinh doanh..."
              className="fieldInput"
            />
          </Field>
          <Field label="Hình thức">
            <select
              value={form.employment_type}
              onChange={(e) =>
                setForm({ ...form, employment_type: e.target.value as FormState["employment_type"] })
              }
              className="fieldInput"
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cấp bậc">
            <input
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              placeholder="Fresher, Nhân viên, Trưởng nhóm..."
              className="fieldInput"
            />
          </Field>
          <Field label="Mức lương hiển thị">
            <input
              value={form.salary_display}
              onChange={(e) => setForm({ ...form, salary_display: e.target.value })}
              placeholder="10 - 15 triệu"
              className="fieldInput"
            />
          </Field>
          <Field label="Hạn nộp hồ sơ">
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="fieldInput"
            />
          </Field>
          <Field label="Email liên hệ">
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="fieldInput"
            />
          </Field>
          <Field label="Link ứng tuyển ngoài (ưu tiên hơn email)">
            <input
              value={form.apply_url}
              onChange={(e) => setForm({ ...form, apply_url: e.target.value })}
              placeholder="https://..."
              className="fieldInput"
            />
          </Field>
        </div>

        <Field label="Mô tả công việc *">
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="fieldInput"
          />
        </Field>
        <Field label="Yêu cầu ứng viên">
          <textarea
            rows={4}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            className="fieldInput"
          />
        </Field>
        <Field label="Quyền lợi">
          <textarea
            rows={4}
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            className="fieldInput"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Field label="Trạng thái">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
              className="fieldInput"
            >
              <option value="draft">Nháp</option>
              <option value="published">Công khai</option>
              <option value="closed">Đã đóng</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Đăng tin"}
          </button>
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-950">Danh sách tin ({jobs.length})</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có tin nào.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        job.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : job.status === "closed"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {job.status === "published"
                        ? "Công khai"
                        : job.status === "closed"
                          ? "Đã đóng"
                          : "Nháp"}
                    </span>
                    <p className="font-semibold text-slate-950">{job.title}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {job.company} · {job.location} · đăng {formatJobDate(job.posted_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.status !== "published" && (
                    <button
                      onClick={() => handleStatusChange(job, "published")}
                      className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Công khai
                    </button>
                  )}
                  {job.status !== "closed" && (
                    <button
                      onClick={() => handleStatusChange(job, "closed")}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Đóng tin
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(job)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .fieldInput {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          color: #172033;
          background: #ffffff;
          outline: none;
        }
        .fieldInput:focus {
          border-color: #2f6f4f;
          box-shadow: 0 0 0 3px rgba(47, 111, 79, 0.14);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
