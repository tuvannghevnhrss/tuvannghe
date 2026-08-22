"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeatureFlagRow } from "@/lib/admin/services/featureFlags";

export default function FeatureFlagsClient({ initialFlags, canEdit }: { initialFlags: FeatureFlagRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [flags, setFlags] = useState(initialFlags);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggle(flag: FeatureFlagRow) {
    try {
      const res = await fetch("/api/admin/settings/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled, rolloutPercent: flag.rolloutPercent, description: flag.description }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Cập nhật thất bại");
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? body.data : f)));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled: false, description }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Tạo thất bại");
      setFlags((prev) => [...prev.filter((f) => f.key !== body.data.key), body.data].sort((a, b) => a.key.localeCompare(b.key)));
      setKey("");
      setDescription("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Key mới</span>
            <input required value={key} onChange={(e) => setKey(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Mô tả</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang tạo..." : "Tạo flag (tắt)"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <div className="font-mono text-sm font-semibold text-slate-900">{f.key}</div>
              {f.description && <p className="mt-0.5 text-xs text-slate-500">{f.description}</p>}
            </div>
            {canEdit ? (
              <button
                onClick={() => toggle(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                  f.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.enabled ? "Đang bật" : "Đang tắt"}
              </button>
            ) : (
              <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${f.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {f.enabled ? "Đang bật" : "Đang tắt"}
              </span>
            )}
          </div>
        ))}
        {flags.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Chưa có feature flag nào.</p>}
      </div>
    </div>
  );
}
