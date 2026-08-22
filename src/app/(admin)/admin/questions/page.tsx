import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/questions/interview", label: "Phỏng vấn AI", desc: "interview_questions — chỉnh sửa được", editable: true },
  { href: "/admin/questions/knowdell/values", label: "Knowdell — Giá trị", desc: "lookup_values — chỉnh sửa được", editable: true },
  { href: "/admin/questions/knowdell/skills", label: "Knowdell — Kỹ năng", desc: "lookup_skills — chỉnh sửa được", editable: true },
  { href: "/admin/questions/knowdell/interests", label: "Knowdell — Sở thích", desc: "lookup_interests — chỉnh sửa được", editable: true },
  { href: "/admin/questions/mbti", label: "MBTI", desc: "60 câu hỏi tĩnh trong code — chỉ xem", editable: false },
  { href: "/admin/questions/holland", label: "Holland", desc: "câu hỏi tĩnh trong code — chỉ xem", editable: false },
];

export default async function AdminQuestionsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "questions", "view")) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ngân hàng câu hỏi</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Câu hỏi MBTI/Holland vẫn nằm trong code (chưa migrate vào DB — xem mục 15 tài liệu thiết kế) nên chỉ hiển thị
        đọc; Knowdell và Phỏng vấn AI chỉnh sửa trực tiếp tại đây.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{s.label}</span>
              {!s.editable && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">Chỉ xem</span>}
            </div>
            <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
