import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { QUESTIONS } from "@/app/mbti/questions";

export const dynamic = "force-dynamic";

export default async function AdminMbtiQuestionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "questions", "view")) notFound();

  return (
    <div>
      <Link href="/admin/questions" className="text-sm text-slate-500 hover:text-slate-800">
        ← Ngân hàng câu hỏi
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">MBTI ({QUESTIONS.length} câu)</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">Chỉ xem</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Nguồn: <code>src/app/mbti/questions.ts</code> — sửa nội dung cần deploy code.
      </p>

      <div className="mt-6 space-y-2">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-slate-900">
                {q.id}. {q.question}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
                {q.pair.join(" / ")}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{q.options.join("  •  ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
