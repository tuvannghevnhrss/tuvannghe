import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/settings/admins", label: "Quản lý Admin", desc: "Thêm/đổi quyền/thu hồi thành viên Back Office" },
  { href: "/admin/settings/flags", label: "Feature Flags", desc: "Bật/tắt tính năng, bao gồm chế độ bảo trì" },
  { href: "/admin/settings/values", label: "Cấu hình hệ thống", desc: "Key-value override cho lib/constants.ts" },
];

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "settings", "view")) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cài đặt hệ thống</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50/40">
            <span className="font-semibold text-slate-900">{s.label}</span>
            <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Thông tin môi trường</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Git commit" value={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "—"} />
          <Row label="Deploy env" value={process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "—"} />
          <Row label="OpenAI key" value={process.env.OPENAI_API_KEY ? "Đã cấu hình" : "Chưa cấu hình"} />
          <Row label="SendGrid key" value={process.env.SENDGRID_API_KEY ? "Đã cấu hình" : "Chưa cấu hình"} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-1.5 first:border-t-0 sm:border-t-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono text-slate-900">{value}</dd>
    </div>
  );
}
