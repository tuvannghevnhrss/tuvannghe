"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ROLES, ROLE_LABEL, type AdminRole } from "@/lib/admin/permissions";
import type { AdminUserRow } from "@/lib/admin/services/adminUsers";

export default function AdminUsersClient({ initialAdmins, currentUserId }: { initialAdmins: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = { USER_NOT_FOUND: "Không tìm thấy user đã đăng nhập với email này" };
        throw new Error(map[body?.error?.code] ?? body?.error?.code ?? "Thêm thất bại");
      }
      setAdmins((prev) => [...prev.filter((a) => a.userId !== body.data.userId), body.data]);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: AdminRole) {
    try {
      const res = await fetch(`/api/admin/settings/admins/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const body = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = { LAST_SUPER_ADMIN: "Không thể hạ quyền super_admin cuối cùng" };
        throw new Error(map[body?.error?.code] ?? body?.error?.code ?? "Đổi quyền thất bại");
      }
      setAdmins((prev) => prev.map((a) => (a.userId === userId ? { ...a, role: newRole } : a)));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đổi quyền thất bại");
    }
  }

  async function handleRemove(userId: string) {
    if (!window.confirm("Thu hồi quyền admin của người này?")) return;
    try {
      const res = await fetch(`/api/admin/settings/admins/${userId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = { LAST_SUPER_ADMIN: "Không thể xoá super_admin cuối cùng" };
        throw new Error(map[body?.error?.code] ?? body?.error?.code ?? "Xoá thất bại");
      }
      setAdmins((prev) => prev.filter((a) => a.userId !== userId));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-600">Email (phải đã đăng nhập ít nhất 1 lần)</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-600">Vai trò</span>
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Đang thêm..." : "Thêm admin"}
        </button>
        {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Thêm lúc</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.userId} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {a.email ?? a.userId}
                  {a.userId === currentUserId && <span className="ml-2 text-xs text-slate-400">(bạn)</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={a.role}
                    onChange={(e) => handleRoleChange(a.userId, e.target.value as AdminRole)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleRemove(a.userId)} className="text-xs font-semibold text-red-600 hover:underline">
                    Thu hồi
                  </button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Chưa có admin nào trong bảng — hệ thống đang chạy hoàn toàn bằng bootstrap ADMIN_EMAILS.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
