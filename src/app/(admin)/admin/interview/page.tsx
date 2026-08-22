import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listSessions } from "@/lib/admin/services/interviewOps";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; moduleType?: string; page?: string }> };

const STATUS_OPTIONS = ["draft", "recording", "processing", "completed", "failed"];
const MODULE_LABEL: Record<number, string> = { 1: "Module 1", 3: "Module 2", 2: "Module 3" };

export default async function AdminInterviewSessionsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "interview", "view")) notFound();

  const { status, moduleType, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = 30;
  const { sessions, total } = await listSessions({
    status,
    moduleType: moduleType ? Number(moduleType) : undefined,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Phỏng vấn AI</h1>
        <Link href="/admin/interview/roles-levels" className="text-sm font-semibold text-emerald-700 hover:underline">
          Vai trò & Cấp độ →
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/interview">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="moduleType" defaultValue={moduleType ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Tất cả module</option>
          <option value="1">Module 1</option>
          <option value="3">Module 2</option>
          <option value="2">Module 3</option>
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Lọc
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Vị trí</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Bắt đầu</th>
              <th className="px-4 py-3">Người dùng</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/interview/${s.id}`} className="font-medium text-emerald-700 hover:underline">
                    {MODULE_LABEL[s.moduleType] ?? `Module ${s.moduleType}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.jobTitle ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(s.startedAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${s.userId}`} className="text-emerald-700 hover:underline">
                    {s.userId.slice(0, 8)}…
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Không có phiên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <span>
          Trang {page}/{totalPages} · {total} phiên
        </span>
        {page > 1 && (
          <Link href={`/admin/interview?${qs({ status, moduleType, page: page - 1 })}`} className="text-emerald-700 hover:underline">
            ← Trước
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/admin/interview?${qs({ status, moduleType, page: page + 1 })}`} className="text-emerald-700 hover:underline">
            Sau →
          </Link>
        )}
      </div>
    </div>
  );
}

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  return sp.toString();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    recording: "bg-sky-50 text-sky-700",
    processing: "bg-sky-50 text-sky-700",
    draft: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
