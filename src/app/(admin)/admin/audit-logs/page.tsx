import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listAuditLogs, listAuditResourceTypes } from "@/lib/admin/services/auditLogs";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ actor?: string; action?: string; resource?: string; page?: string }> };

export default async function AdminAuditLogsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "audit_logs", "view")) notFound();

  const { actor, action, resource, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = 30;

  const [{ logs, total }, resourceTypes] = await Promise.all([
    listAuditLogs({ actorEmail: actor, action, resourceType: resource, page, pageSize }),
    listAuditResourceTypes(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Nhật ký thao tác</h1>
      <p className="mt-1 text-sm text-slate-600">Append-only — mọi thao tác ghi dữ liệu quan trọng của Back Office đều ghi lại ở đây, không sửa/xoá được.</p>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/audit-logs">
        <input name="actor" defaultValue={actor ?? ""} placeholder="Email admin..." className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input name="action" defaultValue={action ?? ""} placeholder="Hành động (vd payment.mark_paid)..." className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select name="resource" defaultValue={resource ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Tất cả resource</option>
          {resourceTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Lọc
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {logs.map((log) => (
          <details key={log.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-semibold text-slate-900">{log.action}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{log.actorEmail ?? "—"}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">
                {log.resourceType}
                {log.resourceId ? ` #${log.resourceId}` : ""}
              </span>
              <span className="ml-auto text-xs text-slate-400">{formatDate(log.createdAt)}</span>
            </summary>
            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-slate-400">Before</div>
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">{JSON.stringify(log.before, null, 2) ?? "null"}</pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold uppercase text-slate-400">After</div>
                <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">{JSON.stringify(log.after, null, 2) ?? "null"}</pre>
              </div>
            </div>
          </details>
        ))}
        {logs.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Không có bản ghi nào khớp bộ lọc.</p>}
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <span>
          Trang {page}/{totalPages} · {total} bản ghi
        </span>
        {page > 1 && (
          <Link href={`/admin/audit-logs?${qs({ actor, action, resource, page: page - 1 })}`} className="text-emerald-700 hover:underline">
            ← Trước
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/admin/audit-logs?${qs({ actor, action, resource, page: page + 1 })}`} className="text-emerald-700 hover:underline">
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
