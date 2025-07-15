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

/* ── MÔ TẢ ngắn Holland ───────────────────────────────────────────────────── */
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
  const step = searchParams?.step ?? "trait"; // trait | options | focus | plan

  // 1. Auth
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  // 2. Lấy hồ sơ từ career_profiles
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type, holland_profile, knowdell_summary, suggested_jobs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  // 3. Kiểm tra thanh toán: cần ba gói mbti, holland, knowdell đã paid
  const { data: payments } = await supabase
    .from("payments")
    .select("product, status")
    .eq("user_id", user.id)
    .eq("status", "paid");
  const paidSet = new Set((payments ?? []).map((p) => p.product));
  const canAnalyse = ["mbti", "holland", "knowdell"].every((pkg) =>
    paidSet.has(pkg)
  );

  // 4. Lấy mục tiêu & hành động
  const [{ data: goal }, { data: actions }] = await Promise.all([
    supabase
      .from("career_goals")
      .select("what, why")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("career_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  // 5. Tóm tắt Knowdell (đã có JSON keys)
  const kb = profile.knowdell_summary ?? {};
  const valuesVI = kb.values ?? [];
  const skillsVI = kb.skills ?? [];
  const interestsVI = kb.interests ?? [];

  // 6. Tính radar Holland + mã TOP-3
  let hollandRadar: { name: string; score: number }[] = [];
  let hollCode: string | null = null;
  if (profile.holland_profile) {
    hollandRadar = Object.entries(profile.holland_profile).map(
      ([name, score]) => ({
        name,
        score: score as number,
      })
    );
    hollCode = hollandRadar
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((o) => o.name)
      .join("");
  }

  // 7. MBTI code
  const mbtiCode = profile.mbti_type ?? null;

  // ─────────── RENDER ───────────
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề</h1>

      {/* Bật tab hiện tại */}
      <StepTabs current={step} />

      {/* TAB 1 – Đặc tính */}
      {step === "trait" && (
        <>
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
                  Chưa làm{" "}
                  <Link href="/mbti" className="text-indigo-600 underline">
                    MBTI
                  </Link>
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
                  {hollandRadar.length > 0 && (
                    <div className="mt-4">
                      <HollandRadar data={hollandRadar} />
                    </div>
                  )}
                </>
              ) : (
                <p className="italic text-gray-500">
                  Chưa làm{" "}
                  <Link href="/holland" className="text-indigo-600 underline">
                    Holland
                  </Link>
                </p>
              )}
            </div>
          </section>

          {/* Knowdell */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tóm tắt Knowdell</h2>
            <ul className="ml-5 list-disc leading-relaxed">
              <li>
                <b>Giá trị cốt lõi:</b>{" "}
                {valuesVI.length > 0 ? (
                  valuesVI.join(", ")
                ) : (
                  <i className="text-gray-500">chưa chọn</i>
                )}
              </li>
              <li>
                <b>Kỹ năng động lực:</b>{" "}
                {skillsVI.length > 0 ? (
                  skillsVI.join(", ")
                ) : (
                  <i className="text-gray-500">chưa chọn</i>
                )}
              </li>
              <li>
                <b>Sở thích nổi bật:</b>{" "}
                {interestsVI.length > 0 ? (
                  interestsVI.join(", ")
                ) : (
                  <i className="text-gray-500">chưa chọn</i>
                )}
              </li>
            </ul>
          </section>
        </>
      )}

      {/* TAB 2 – Lựa chọn / Phân tích */}
      {step === "options" && (
        <div className="mt-6">
          {canAnalyse ? (
            <OptionsTab
              mbti={mbtiCode}
              holland={hollCode}
              knowdell={profile.knowdell_summary}
              initialJobs={profile.suggested_jobs ?? []}
            />
          ) : (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center space-y-4">
              <p className="text-lg font-medium">
                Bạn cần hoàn tất thanh toán 3 gói dưới để sử dụng phân tích kết hợp:
              </p>
              <ul className="list-disc list-inside text-left mx-auto max-w-md">
                <li>MBTI (10K)</li>
                <li>Holland (20K)</li>
                <li>Knowdell (100K)</li>
              </ul>
              <Link
                href="/checkout?product=combo"
                className="inline-block rounded bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
              >
                Mua ngay gói Combo
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3 – Mục tiêu */}
      {step === "focus" && <FocusTab existingGoal={goal ?? null} />}

      {/* TAB 4 – Kế hoạch */}
      {step === "plan" && <PlanTab actions={actions ?? []} />}
    </div>
  );
}
