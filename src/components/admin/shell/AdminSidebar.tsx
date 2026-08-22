"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/admin/navigation";
import { can, type AdminRole } from "@/lib/admin/permissions";

export default function AdminSidebar({ role, unreadNotifications = 0 }: { role: AdminRole; unreadNotifications?: number }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-6 px-2 text-sm font-bold tracking-tight text-slate-900">Back Office</div>

      <nav className="space-y-6">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter((item) => can(role, item.module, "view"));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gi}>
              {group.title && (
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
              )}
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const active = pathname === item.href;
                  const href =
                    item.status === "live" ? item.href : `/admin/coming-soon?title=${encodeURIComponent(item.label)}`;

                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        className={[
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm transition",
                          active ? "bg-emerald-50 font-medium text-emerald-700" : "text-slate-600 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span>{item.label}</span>
                        {item.module === "notifications" && unreadNotifications > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            {unreadNotifications}
                          </span>
                        )}
                        {item.status === "planned" && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            Sắp có
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
