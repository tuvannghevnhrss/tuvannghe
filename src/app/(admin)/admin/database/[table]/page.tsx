import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { browseTable, isExplorerTable } from "@/lib/admin/services/databaseExplorer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ table: string }>; searchParams: Promise<{ page?: string }> };

export default async function AdminDatabaseTablePage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "database", "view")) notFound();

  const { table } = await params;
  if (!isExplorerTable(table)) notFound();

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = 30;

  const { rows, columns, total } = await browseTable(table, { page, pageSize }, admin);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <Link href="/admin/database" className="text-sm text-slate-500 hover:text-slate-800">
        ← Database Explorer
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold text-slate-900">{table}</h1>
        <a href={`/api/admin/database/${table}/export`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Xuất CSV (tối đa 5.000 dòng)
        </a>
      </div>
      <p className="mt-1 text-sm text-slate-500">{total} dòng · chỉ đọc</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {columns.map((c) => (
                  <td key={c} className="max-w-xs truncate px-3 py-2 font-mono">
                    {formatCell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="px-3 py-8 text-center text-slate-400">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <span>
          Trang {page}/{totalPages}
        </span>
        {page > 1 && (
          <Link href={`/admin/database/${table}?page=${page - 1}`} className="text-emerald-700 hover:underline">
            ← Trước
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/admin/database/${table}?page=${page + 1}`} className="text-emerald-700 hover:underline">
            Sau →
          </Link>
        )}
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
