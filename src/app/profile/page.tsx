// -----------------------------------------------------------------------------
// src/app/profile/page.tsx
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import Link from "next/link";
import StepTabs from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadar";
import OptionsTab from "@/components/OptionsTab";
import FocusTab from "@/components/FocusTab";
import PlanTab from "@/components/PlanTab";
import { MBTI_MAP } from "@/lib/mbtiDescriptions";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/* ── MÔ TẢ Holland ── */
const H_DESC: Record<string, string> = {
  R: "Realistic – Ưa hành động, thao tác với vật thể.",
  I: "Investigative – Phân tích, khám phá, nghiên cứu.",
  A: "Artistic – Sáng tạo, trực giác, biểu đạt ý tưởng.",
  S: "Social – Hỗ trợ, hợp tác, giúp đỡ người khác.",
  E: "Enterprising – Thuyết phục, lãnh đạo, kinh doanh.",
  C: "Conventional – Tỉ mỉ, dữ liệu, quy trình, tổ chức.",
};

export default async function Profile({
  searchParams,
}: {
  searchParams?: { step?: string };
}) {
  const step = searchParams?.step ?? "trait";

  /* 1. Auth */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2. Hồ sơ */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type, holland_profile, knowdell_summary, suggested_jobs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3. Kiểm tra thanh toán (đủ 3 gói?) */
  const { data: paid } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", "paid");
  const hasPaid = new Set(paid?.map((p) => p.product));
  const canAnalyse = ["mbti", "holland", "knowdell"].every((k) =>
    hasPaid.has(k)
  );

  /* 4. Lấy mục tiêu & hành động */
  const [{ data: goal }, { data: actions }] = await Promise.all([
    supabase
      .from("career_goals")
      .select("what,why")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("career_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  /* 5. Knowdell VN Labels (rút gọn – bỏ phần mapVN để ngắn) */
  const kb = profile.knowdell_summary ?? {};
  const valuesVI = (kb.values ?? []) as string[];
  const skillsVI = (kb.skills ?? []) as string[];
  const interestsVI = (kb.interests ?? []) as string[];

  /* 6. Holland radar + code */
  let hollCode: string | null = null;
  let hollandRadar: { name: string; score: number }[] = [];
  if (profile.holland_profile) {
    hollandRadar = Object.entries(profile.holland_profile).map(([n, s]) => ({
      name: n,
      score: s as number,
    }));
    hollCode = [...hollandRadar]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((o) => o.name)
      .join("");
  }

  const mbtiCode = profile.mbti_type ?? null;

  /* 7. Render */
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề</h1>

      <StepTabs current={step} />

      {/* TAB 1 ─ Đặc tính */}
      {step === "trait" && (
        <>
          {/* MBTI + Holland */}
          <section className="grid gap-8 md:grid-cols-2">
            {/* MBTI */}
            <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">MBTI</h2>
              {mbtiCode ? (
                <>
                  <p className="text-2xl font-bold">{mbtiCode}</p>
                  <p>{MBTI_MAP[mbtiCode]?.intro ?? "Đang cập nhật mô tả."}</p>
                </>
              ) : (
                <p className="italic text-gray-500">
                  Chưa làm <Link href="/mbti" className="text-indigo-600 underline">MBTI</Link>
                </p>
              )}
            </div>

            {/* Holland */}
            <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Holland</h2>
              {hollCode ? (
                <>
                  <p className="text-2xl font-bold">{hollCode}</p>
                  <p className="text-sm">
                    {hollCode.split("").map((c) => H_DESC[c]).join(" | ")}
                  </p>
                  {!!hollandRadar.length && (
                    <div className="mt-4">
                      <HollandRadar data={hollandRadar} />
                    </div>
                  )}
                </>
              ) : (
                <p className="italic text-gray-500">
                  Chưa làm <Link href="/holland" className="text-indigo-600 underline">Holland</Link>
                </p>
              )}
            </div>
          </section>

          {/* Knowdell */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tóm tắt Knowdell</h2>
            <ul className="ml-5 list-disc leading-relaxed">
              <li><b>Giá trị cốt lõi:</b> {valuesVI.length ? valuesVI.join(", ") : <i className="text-gray-500">chưa chọn</i>}</li>
              <li><b>Kỹ năng động lực:</b> {skillsVI.length ? skillsVI.join(", ") : <i className="text-gray-500">chưa chọn</i>}</li>
              <li><b>Sở thích nổi bật:</b> {interestsVI.length ? interestsVI.join(", ") : <i className="text-gray-500">chưa chọn</i>}</li>
            </ul>
          </section>
        </>
      )}

      {/* TAB 2 ─ Lựa chọn */}
      {step === "options" && (
        <OptionsTab
          mbti={mbtiCode}
          holland={hollCode}
          knowdell={profile.knowdell_summary}
          initialJobs={profile.suggested_jobs ?? []}
          canAnalyse={canAnalyse}
        />
      )}

      {/* TAB 3 – Mục tiêu */}
      {step === "focus" && <FocusTab existingGoal={goal ?? null} />}

      {/* TAB 4 – Kế hoạch */}
      {step === "plan" && <PlanTab actions={actions ?? []} />}
    </div>
  );
}
