"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromptVersion } from "@/lib/admin/services/prompts";

export default function PromptDetailClient({
  promptKey,
  module,
  initialVersions,
  canEdit,
}: {
  promptKey: string;
  module: string;
  initialVersions: PromptVersion[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [versions, setVersions] = useState(initialVersions);
  const latest = versions[0];

  const [template, setTemplate] = useState(latest?.template ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sampleMessage, setSampleMessage] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: promptKey, module, template }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Lưu thất bại");
      setVersions((prev) => [body.data, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string) {
    if (!window.confirm("Publish bản này thành live? Toàn bộ lời gọi AI dùng key này sẽ đổi sang nội dung mới ngay lập tức.")) return;
    try {
      const res = await fetch(`/api/admin/prompts/${id}/publish`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Publish thất bại");
      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === id) return { ...v, status: "live" };
          if (v.status === "live") return { ...v, status: "archived" };
          return v;
        })
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Publish thất bại");
    }
  }

  async function handleSandboxTest() {
    setSandboxLoading(true);
    setSandboxError(null);
    setSandboxOutput(null);
    try {
      const res = await fetch("/api/admin/prompts/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, sampleMessage }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.code ?? "Gọi thử thất bại");
      setSandboxOutput(body.data.output);
    } catch (err) {
      setSandboxError(err instanceof Error ? err.message : "Gọi thử thất bại");
    } finally {
      setSandboxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <form onSubmit={handleCreateDraft} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tạo bản draft mới</h2>
          <textarea
            required
            rows={6}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : `Lưu thành v${(latest?.version ?? 0) + 1} (draft)`}
          </button>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}

      {canEdit && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Sandbox — thử trước khi publish</h2>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-600">Tin nhắn mẫu của user</span>
            <input
              value={sampleMessage}
              onChange={(e) => setSampleMessage(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ví dụ: Em nên chọn ngành gì nếu thích vẽ?"
            />
          </label>
          <button
            onClick={handleSandboxTest}
            disabled={sandboxLoading || !template || !sampleMessage}
            className="mt-3 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {sandboxLoading ? "Đang gọi AI..." : "Gọi thử"}
          </button>
          {sandboxError && <p className="mt-2 text-sm font-semibold text-red-600">{sandboxError}</p>}
          {sandboxOutput && <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">{sandboxOutput}</p>}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Lịch sử version</h2>
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">v{v.version}</span>
                <div className="flex items-center gap-2">
                  <StatusPill status={v.status} />
                  {canEdit && v.status === "draft" && (
                    <button onClick={() => handlePublish(v.id)} className="text-xs font-semibold text-emerald-700 hover:underline">
                      Publish
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{v.template}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    live: "bg-emerald-50 text-emerald-700",
    draft: "bg-amber-50 text-amber-700",
    archived: "bg-slate-100 text-slate-500",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
