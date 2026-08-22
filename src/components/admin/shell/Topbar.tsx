import Link from "next/link";
import { ROLE_LABEL, type AdminRole } from "@/lib/admin/permissions";

export default function Topbar({ email, role }: { email: string | null; role: AdminRole }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← Về trang chính
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">{email}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {ROLE_LABEL[role]}
        </span>
      </div>
    </header>
  );
}
