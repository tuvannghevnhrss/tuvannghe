"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="mb-4 text-sm text-slate-500">
      <Link href="/admin" className="hover:text-slate-800">
        Admin
      </Link>
      {segments.map((seg, i) => {
        const href = "/admin/" + segments.slice(0, i + 1).join("/");
        return (
          <span key={href}>
            <span className="mx-2 text-slate-300">/</span>
            <Link href={href} className="capitalize hover:text-slate-800">
              {seg.replace(/-/g, " ")}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
