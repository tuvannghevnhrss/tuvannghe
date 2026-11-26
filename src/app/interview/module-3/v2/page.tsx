import { Suspense } from "react";
import type { Metadata } from "next";
import Module3V2Client from "@/components/interview/m3/Module3V2Client";

export const metadata: Metadata = {
  title: "Phỏng vấn AI theo CV & JD (Module 3 – V2) | Tư vấn nghề",
};

export const dynamic = "force-dynamic";

export default function Module3V2Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Đang tải…</div>}>
      <Module3V2Client />
    </Suspense>
  );
}
