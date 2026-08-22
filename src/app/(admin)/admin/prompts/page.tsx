import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { listPromptKeys } from "@/lib/admin/services/prompts";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "prompts", "view")) notFound();

  const keys = await listPromptKeys();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Quản lý Prompt</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Mỗi key có nhiều version; chỉ 1 version ở trạng thái &quot;live&quot; tại một thời điểm — đó là bản đang được
        AI thực tế sử dụng. Hiện có <code>chat.system</code> làm thí điểm; các prompt khác (phân tích Knowdell,
        chấm điểm phỏng vấn) vẫn nằm trong code, sẽ chuyển dần sau.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Bản live</th>
              <th className="px-4 py-3">Số version</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.key} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/prompts/${encodeURIComponent(k.key)}`} className="font-mono font-medium text-emerald-700 hover:underline">
                    {k.key}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{k.module}</td>
                <td className="px-4 py-3">
                  {k.liveVersion ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">v{k.liveVersion}</span>
                  ) : (
                    <span className="text-slate-400">Chưa publish</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{k.versionCount}</td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Chưa có prompt nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
