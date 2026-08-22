"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SettingRow } from "@/lib/admin/services/settings";

export default function SystemSettingsClient({ initialSettings, canEdit }: { initialSettings: SettingRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value; // cho phép nhập chuỗi thường, không bắt buộc JSON hợp lệ
      }

      const res = await fetch("/api/admin/settings/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: parsedValue, description: description || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");

      setSettings((prev) => [...prev.filter((s) => s.key !== body.data.key), body.data].sort((a, b) => a.key.localeCompare(b.key)));
      setKey("");
      setValue("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(k: string) {
    if (!window.confirm(`Xoá setting "${k}"? Code dùng key này sẽ rơi về giá trị mặc định trong lib/constants.ts.`)) return;
    try {
      const res = await fetch(`/api/admin/settings/system/${encodeURIComponent(k)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      setSettings((prev) => prev.filter((s) => s.key !== k));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Key</span>
              <input required value={key} onChange={(e) => setKey(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-semibold text-slate-600">Mô tả</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Giá trị (JSON hoặc chuỗi thường)</span>
            <textarea
              required
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Ví dụ: 100000 hoặc "text" hoặc {"holland": 25000}'
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            />
          </label>
          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}

      <div className="space-y-2">
        {settings.map((s) => (
          <div key={s.key} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono font-semibold text-slate-900">{s.key}</div>
                {s.description && <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>}
              </div>
              {canEdit && (
                <button onClick={() => handleDelete(s.key)} className="text-xs font-semibold text-red-600 hover:underline">
                  Xoá
                </button>
              )}
            </div>
            <pre className="mt-2 overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">{JSON.stringify(s.value, null, 2)}</pre>
          </div>
        ))}
        {settings.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Chưa có setting nào — mọi giá trị đang lấy từ lib/constants.ts.</p>}
      </div>
    </div>
  );
}
