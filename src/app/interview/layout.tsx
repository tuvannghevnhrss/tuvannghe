"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import InterviewSidebar from "@/components/interview/InterviewSidebar";
import InterviewMobileNav from "@/components/interview/InterviewMobileNav";

export default function InterviewLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHubPage = pathname === "/interview";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.08),_transparent_28%),linear-gradient(180deg,#fafafe_0%,#f5f7fb_52%,#eef2ff_100%)]">
      <div className={`mx-auto gap-6 px-4 py-6 sm:px-6 lg:px-8 ${isHubPage ? "max-w-7xl" : "flex max-w-[1520px]"}`}>
        {!isHubPage && <InterviewSidebar />}
        <div className="min-w-0 flex-1">
          {!isHubPage && <InterviewMobileNav />}
          {children}
        </div>
      </div>
    </div>
  );
}
