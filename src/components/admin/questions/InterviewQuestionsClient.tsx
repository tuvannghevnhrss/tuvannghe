"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewQuestionRow } from "@/lib/admin/services/questions";

type Option = { id: string; name: string };

const EMPTY_FORM = {
  id: "",
  content: "",
  category: "",
  roleId: "",
  difficultyLevelId: "",
  experienceLevelId: "",
  tags: "",
  idealAnswer: "",
};

export default function InterviewQuestionsClient({
  initialQuestions,
  roles,
  difficulties,
  experiences,
  canEdit,
}: {
  initialQuestions: InterviewQuestionRow[];
  roles: Option[];
  difficulties: Option[];
  experiences: Option[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleName = (id: string | null) => roles.find((r) => r.id === id)?.name ?? "—";
  const difficultyName = (id: string | null) => difficulties.find((r) => r.id === id)?.name ?? "—";
  const experienceName = (id: string | null) => experiences.find((r) => r.id === id)?.name ?? "—";

  function startEdit(q: InterviewQuestionRow) {
    setForm({
      id: q.id,
      content: q.content,
      category: q.category ?? "",
      roleId: q.roleId ?? "",
      difficultyLevelId: q.difficultyLevelId ?? "",
      experienceLevelId: q.experienceLevelId ?? "",
      tags: q.tags.join(", "),
      idealAnswer: q.idealAnswer ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          content: form.content,
          category: form.category || null,
          roleId: form.roleId || null,
          difficultyLevelId: form.difficultyLevelId || null,
          experienceLevelId: form.experienceLevelId || null,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          idealAnswer: form.idealAnswer || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");

      const saved = body.data as any;
      const savedRow: InterviewQuestionRow = {
        id: saved.id,
        content: saved.content,
        category: saved.category,
        roleId: saved.role_id,
        difficultyLevelId: saved.difficulty_level_id,
        experienceLevelId: saved.experience_level_id,
        tags: saved.tags ?? [],
        idealAnswer: saved.ideal_answer,
      };
      setQuestions((prev) => {
        const next = prev.filter((q) => q.id !== savedRow.id);
        return [savedRow, ...next];
      });
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xoá câu hỏi này?")) return;
    try {
      const res = await fetch(`/api/admin/questions/interview/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (form.id === id) resetForm();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    }
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">{form.id ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}</h2>
            {form.id && (
              <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                Huỷ chỉnh sửa
              </button>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Nội dung câu hỏi *</span>
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Danh mục</span>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Vai trò</span>
              <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Độ khó</span>
              <select
                value={form.difficultyLevelId}
                onChange={(e) => setForm({ ...form, difficultyLevelId: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {difficulties.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Cấp kinh nghiệm</span>
              <select
                value={form.experienceLevelId}
                onChange={(e) => setForm({ ...form, experienceLevelId: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {experiences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Tags (phân cách bởi dấu phẩy)</span>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Gợi ý câu trả lời tốt</span>
            <textarea
              rows={3}
              value={form.idealAnswer}
              onChange={(e) => setForm({ ...form, idealAnswer: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Thêm câu hỏi"}
          </button>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Danh sách câu hỏi ({questions.length})</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có câu hỏi nào.</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{q.content}</p>
                  {canEdit && (
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => startEdit(q)} className="text-xs font-semibold text-emerald-700 hover:underline">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="text-xs font-semibold text-red-600 hover:underline">
                        Xoá
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {q.category ?? "Chung"} · {roleName(q.roleId)} · {difficultyName(q.difficultyLevelId)} · {experienceName(q.experienceLevelId)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
