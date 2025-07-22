// -----------------------------------------------------------------------------
// src/app/profile/page.tsx
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import Link from "next/link";

import StepTabs     from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadar";
import OptionsTab   from "@/components/OptionsTab";
import FocusTab     from "@/components/FocusTab";
import PlanTab      from "@/components/PlanTab";

import { MBTI_MAP }      from "@/lib/mbtiDescriptions";
import { HOLLAND_MAP }   from "@/lib/hollandDescriptions";   // ➊ NEW – bản mô tả chi tiết Holland
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/* ──────────── component ──────────── */
export default async function Profile({
  searchParams,
}: {
  searchParams?: { step?: string };
}) {
  const step = searchParams?.step ?? "trait"; // trait | options | focus | plan

  /* 1 ▸ Auth --------------------------------------------------------------- */
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2 ▸ Lấy hồ sơ ---------------------------------------------------------- */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type, holland_profile, knowdell_summary, suggested_jobs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3 ▸ Thanh toán --------------------------------------------------------- */
  const { data: payments } = await supabase
    .from("payments")
    .select("product, status")
    .eq("user_id", user.id)
    .eq("status", "paid");
  const paidSet    = new Set((payments ?? []).map((p) => p.product));
  const canAnalyse = ["mbti", "holland", "knowdell"].every((pkg) =>
    paidSet.has(pkg)
  );

  /* 4 ▸ Mục tiêu + hành động --------------------------------------------- */
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

  /* 5 ▸ Knowdell tóm tắt --------------------------------------------------- */
  const kb           = profile.knowdell_summary ?? {};
  const valuesVI     = kb.values     ?? [];
  const skillsVI     = kb.skills     ?? [];
  const interestsVI  = kb.interests  ?? [];

  /* 6 ▸ Holland ----------------------------------------------------------- */
  type Radar = { name: string; score: number };
  let hollandRadar : Radar[] = [];
  let hollCode     : string | null = null;
  if (profile.holland_profile) {
    hollandRadar = Object.entries(profile.holland_profile).map(
      ([name, score]) => ({ name, score: score as number })
    );
    hollCode = hollandRadar
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((o) => o.name)
      .join("");
  }

  // 👉 Lấy mô tả chi tiết nếu có
  const hollandInfo = hollCode
    ? HOLLAND_MAP[hollCode as keyof typeof HOLLAND_MAP]       // ➋ dùng bản mô tả chi tiết
    : undefined;

  /* 7 ▸ MBTI -------------------------------------------------------------- */
  const mbtiCode   : string | null = profile.mbti_type ?? null;
  const mbtiInfo   = mbtiCode ? MBTI_MAP[mbtiCode as keyof typeof MBTI_MAP] : undefined;

  const strengths  = mbtiInfo?.strengths ?? [];
  const flaws      = mbtiInfo?.flaws     ?? [];
  const careers    = mbtiInfo?.careers   ?? [];

  /* ────────────  R E N D E R  ──────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-20">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề nghiệp</h1>

      {/* Tabs */}
      <StepTabs current={step} />

      {/* TAB 1 – Đặc tính */}
      {step === "trait" && (
        <>
          <section className="grid gap-8 md:grid-cols-2">
            {/* MBTI ------------------------------------------------------- */}
            <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">MBTI</h2>

              {mbtiCode ? (
                <>
                  <p className="text-2xl font-bold">{mbtiCode}</p>
                  <p>{mbtiInfo?.intro ?? "Đang cập nhật mô tả."}</p>

                  {(strengths.length || flaws.length || careers.length) > 0 && (
                    <div className="mt-4 grid gap-6 sm:grid-cols-3 text-[15px] leading-relaxed">
                      {/* strengths */}
                      {strengths.length > 0 && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            💪 Thế mạnh
                          </h3>
                          <ul className="list-disc list-inside">
                            {strengths.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* flaws */}
                      {flaws.length > 0 && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            ⚠️ Điểm yếu
                          </h3>
                          <ul className="list-disc list-inside">
                            {flaws.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* careers */}
                      {careers.length > 0 && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            🎯 Nghề phù hợp
                          </h3>
                          <ul className="list-disc list-inside">
                            {careers.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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

            {/* Holland ---------------------------------------------------- */}
            <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Holland</h2>

              {hollCode ? (
                <>
                  <p className="text-2xl font-bold">{hollCode}</p>

                  {/* giới thiệu ngắn */}
                  <p className="text-sm">
                    {hollandInfo?.intro ??
                      hollCode
                        .split("")
                        .map((c) => HOLLAND_MAP[c as keyof typeof HOLLAND_MAP]?.intro)
                        .filter(Boolean)
                        .join(" | ") }
                  </p>

                  {/* strengths / flaws / careers (nếu có trong file mô tả) */}
                  {(hollandInfo?.strengths?.length ||
                    hollandInfo?.flaws?.length ||
                    hollandInfo?.careers?.length) && (
                    <div className="mt-4 grid gap-6 sm:grid-cols-3 text-[15px] leading-relaxed">
                      {/* strengths */}
                      {hollandInfo?.strengths?.length && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            💪 Thế mạnh
                          </h3>
                          <ul className="list-disc list-inside">
                            {hollandInfo.strengths.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* flaws */}
                      {hollandInfo?.flaws?.length && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            ⚠️ Điểm yếu
                          </h3>
                          <ul className="list-disc list-inside">
                            {hollandInfo.flaws.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* careers */}
                      {hollandInfo?.careers?.length && (
                        <div>
                          <h3 className="mb-1 font-semibold flex items-center gap-1">
                            🎯 Nghề phù hợp
                          </h3>
                          <ul className="list-disc list-inside">
                            {hollandInfo.careers.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Radar chart */}
                  {hollandRadar.length > 0 && (
                    <div className="mt-5">
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

          {/* Knowdell ----------------------------------------------------- */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tóm tắt Knowdell</h2>
            <ul className="ml-5 list-disc leading-relaxed">
              <li>
                <b>Giá trị cốt lõi:</b>{" "}
                {valuesVI.length ? valuesVI.join(", ") : (
                  <i className="text-gray-500">chưa chọn</i>
                )}
              </li>
              <li>
                <b>Kỹ năng động lực:</b>{" "}
                {skillsVI.length ? skillsVI.join(", ") : (
                  <i className="text-gray-500">chưa chọn</i>
                )}
              </li>
              <li>
                <b>Sở thích nổi bật:</b>{" "}
                {interestsVI.length ? interestsVI.join(", ") : (
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
