import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { EXPLORER_TABLES } from "@/lib/admin/services/databaseExplorer";

export const dynamic = "force-dynamic";

export default async function AdminDatabasePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "database", "view")) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Database Explorer</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Chỉ đọc — {EXPLORER_TABLES.length} bảng nằm trong whitelist. Mọi lượt xem/xuất CSV đều ghi vào Nhật ký thao
        tác. Muốn sửa dữ liệu, dùng đúng module nghiệp vụ (Payments, Ngân hàng câu hỏi, Cài đặt hệ thống...).
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {EXPLORER_TABLES.map((t) => (
          <Link key={t} href={`/admin/database/${t}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40">
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
