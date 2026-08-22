"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; name: string; slug?: string | null; sort_order?: number | null };

export default function InterviewLookupCrud({
  table,
  title,
  initialRows,
  hasSlug,
  hasSortOrder,
  canEdit,
  canDelete,
}: {
  table: "interview_roles" | "interview_difficulty_levels" | "interview_experience_levels";
  title: string;
  initialRows: Row[];
  hasSlug?: boolean;
  hasSortOrder?: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/interview/lookup/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, sortOrder: sortOrder || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");
      setRows((prev) => [...prev, body.data]);
      setName("");
      setSlug("");
      setSortOrder("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xoá mục này? Câu hỏi đang gắn với mục này có thể mất liên kết.")) return;
    try {
      const res = await fetch(`/api/admin/interview/lookup/${table}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>

      {canEdit && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Tên</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {hasSlug && (
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Slug</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          )}
          {hasSortOrder && (
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Thứ tự</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : "Thêm"}
          </button>
          {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}

      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {r.name}
              {r.slug && <span className="ml-2 text-xs text-slate-400">({r.slug})</span>}
              {typeof r.sort_order === "number" && <span className="ml-2 text-xs text-slate-400">#{r.sort_order}</span>}
            </span>
            {canDelete && (
              <button onClick={() => handleDelete(r.id)} className="text-xs font-semibold text-red-600 hover:underline">
                Xoá
              </button>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="py-4 text-center text-sm text-slate-400">Chưa có mục nào.</li>}
      </ul>
    </div>
  );
}
