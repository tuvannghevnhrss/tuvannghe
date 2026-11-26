import type { ReactNode } from "react";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Cập nhật lần cuối: {updated}</p>
      <div className="mt-8 space-y-4 leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}
