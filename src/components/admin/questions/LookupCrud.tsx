"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LookupRow, LookupTable } from "@/lib/admin/services/lookups";

export default function LookupCrud({
  table,
  initialRows,
  canEdit,
}: {
  table: LookupTable;
  initialRows: LookupRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [key, setKey] = useState("");
  const [vi, setVi] = useState("");
  const [en, setEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/lookup/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, vi, en: en || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");

      setRows((prev) => {
        const next = prev.filter((r) => r.key !== body.data.key);
        return [...next, body.data].sort((a, b) => a.key.localeCompare(b.key));
      });
      setKey("");
      setVi("");
      setEn("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rowKey: string) {
    if (!window.confirm(`Xoá "${rowKey}"?`)) return;
    try {
      const res = await fetch(`/api/admin/questions/lookup/${table}/${encodeURIComponent(rowKey)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      setRows((prev) => prev.filter((r) => r.key !== rowKey));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Mã (key)</span>
            <input required value={key} onChange={(e) => setKey(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Tiếng Việt</span>
            <input required value={vi} onChange={(e) => setVi(e.target.value)} className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Tiếng Anh</span>
            <input value={en} onChange={(e) => setEn(e.target.value)} className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : "Thêm / cập nhật"}
          </button>
          {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tiếng Việt</th>
              <th className="px-4 py-3">Tiếng Anh</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{r.key}</td>
                <td className="px-4 py-3">{r.vi}</td>
                <td className="px-4 py-3 text-slate-500">{r.en ?? "—"}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(r.key)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Xoá
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-8 text-center text-slate-400">
                  Chưa có mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
