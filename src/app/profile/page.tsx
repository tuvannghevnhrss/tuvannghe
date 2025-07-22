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
import { HOLLAND_MAP }   from "@/lib/hollandDescriptions";      // 👈
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

/* ───────────── component ───────────── */
export default async function Profile({
  searchParams,
}: {
  searchParams?: { step?: string };
}) {
  const step = searchParams?.step ?? "trait";

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

  /* 4 ▸ Các bảng khác ------------------------------------------------------ */
  const [{ data: goal }, { data: actions }] = await Promise.all([
    supabase.from("career_goals").select("what, why").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("career_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  /* 5 ▸ Knowdell tóm tắt --------------------------------------------------- */
  const kb          = profile.knowdell_summary ?? {};
  const valuesVI    = kb.values    ?? [];
  const skillsVI    = kb.skills    ?? [];
  const interestsVI = kb.interests ?? [];

  /* 6 ▸ Holland ------------------------------------------------------------ */
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

  /* ✅ NEW ✔  gộp mô tả & list cho cả mã đơn lẫn mã ghép */
  function merge<T extends string>(getter: (k: keyof typeof HOLLAND_MAP) => T[] | undefined) {
    if (!hollCode) return [];
    return [...new Set(
      hollCode
        .split("")
        .flatMap((c) => getter(c as keyof typeof HOLLAND_MAP) ?? [])
    )];
  }

  const hollandIntro =
    hollCode?.split("")
      .map((c) => HOLLAND_MAP[c as keyof typeof HOLLAND_MAP]?.intro)
      .filter(Boolean)
      .join(" | ") ?? "";

  const hTraits       = merge((k) => HOLLAND_MAP[k]?.traits);
  const hStrengths    = merge((k) => HOLLAND_MAP[k]?.strengths);
  const hWeaknesses   = merge((k) => HOLLAND_MAP[k]?.weaknesses);
  const hImprovements = merge((k) => HOLLAND_MAP[k]?.improvements);
  const hCareers      = merge((k) => HOLLAND_MAP[k]?.careers);

  /* 7 ▸ MBTI -------------------------------------------------------------- */
  const mbtiCode : string | null = profile.mbti_type ?? null;
  const mbtiInfo = mbtiCode ? MBTI_MAP[mbtiCode as keyof typeof MBTI_MAP] : undefined;

  /* ─────────────  R E N D E R  ───────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-20">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề nghiệp</h1>
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

                  {(mbtiInfo?.strengths?.length ||
                    mbtiInfo?.flaws?.length ||
                    mbtiInfo?.careers?.length) && (
                    <div className="mt-4 grid gap-6 sm:grid-cols-3 text-[15px] leading-relaxed">
                      {mbtiInfo.strengths?.length && (
                        <MbtiBlock title="💪 Thế mạnh" list={mbtiInfo.strengths} />
                      )}
                      {mbtiInfo.flaws?.length && (
                        <MbtiBlock title="⚠️ Điểm yếu" list={mbtiInfo.flaws} />
                      )}
                      {mbtiInfo.careers?.length && (
                        <MbtiBlock title="🎯 Nghề phù hợp" list={mbtiInfo.careers} />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyLink label="MBTI" href="/mbti" />
              )}
            </div>

            {/* Holland ---------------------------------------------------- */}
            <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Holland</h2>

              {hollCode ? (
                <>
                  <p className="text-2xl font-bold">{hollCode}</p>
                  <p className="text-sm leading-relaxed">
                    {hollandInfo?.intro ??
                      hollCode
                        .split("")
                        .map((c) => HOLLAND_MAP[c as keyof typeof HOLLAND_MAP]?.intro)
                        .filter(Boolean)
                        .join(" | ")}
                  </p>

                  {(hTraits.length ||
                    hStrengths.length ||
                    hWeaknesses.length ||
                    hImprovements.length ||
                    hCareers.length) && (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-[15px] leading-relaxed">
                      {hTraits.length > 0 && (
                        <Block title="🔎 Đặc trưng" list={hTraits} />
                      )}
                      {hStrengths.length > 0 && (
                        <Block title="💪 Thế mạnh" list={hStrengths} />
                      )}
                      {hWeaknesses.length > 0 && (
                        <Block title="⚠️ Điểm yếu" list={hWeaknesses} />
                      )}
                      {hImprovements.length > 0 && (
                        <Block title="🛠 Cần cải thiện" list={hImprovements} />
                      )}
                      {hCareers.length > 0 && (
                        <Block title="🎯 Nghề phù hợp" list={hCareers} />
                      )}
                    </div>
                  )}

                  {hollandRadar.length > 0 && (
                    <div className="mt-6">
                      <HollandRadar data={hollandRadar} />
                    </div>
                  )}
                </>
              ) : (
                <EmptyLink label="Holland" href="/holland" />
              )}
            </div>
          </section>

          {/* Knowdell & các phần khác giữ nguyên */}
          <div className="space-y-2 rounded-lg border bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="text-xl font-semibold">Tóm tắt Knowdell</h2>

            {valuesVI.length || skillsVI.length || interestsVI.length ? (
              <div className="grid gap-6 lg:grid-cols-3 text-[15px] leading-relaxed">
                {valuesVI.length > 0 && (
                  <Block title="💎 Giá trị cốt lõi" list={valuesVI} />
                )}
                {skillsVI.length > 0 && (
                  <Block title="🛠 Kỹ năng động lực" list={skillsVI} />
                )}
                {interestsVI.length > 0 && (
                  <Block title="🎈 Sở thích nổi bật" list={interestsVI} />
                )}
              </div>
            ) : (
              <EmptyLink label="Knowdell" href="/knowdell" />
            )}
          </div>
        </>
      )}

      {/* TAB 2, 3, 4 … giữ nguyên hoàn toàn */}
      {step === "options" && (
        canAnalyse ? (
          <OptionsTab
            mbti={mbtiCode}
            holland={hollCode}
            knowdell={profile.knowdell_summary}
            initialJobs={profile.suggested_jobs ?? []}
          />
        ) : (
          <Paywall />
        )
      )}

      {step === "focus" && <FocusTab existingGoal={goal ?? null} />}
      {step === "plan"  && <PlanTab  actions={actions ?? []} />}
    </div>
  );
}

/* ---------- small helpers ---------- */

function Block({ title, list }: { title: string; list: string[] }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold flex items-center gap-1">{title}</h3>
      <ul className="list-disc list-inside">
        {list.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function MbtiBlock(props: { title: string; list: string[] }) {
  return <Block {...props} />;
}

function EmptyLink({ label, href }: { label: string; href: string }) {
  return (
    <p className="italic text-gray-500">
      Chưa làm <Link href={href} className="text-indigo-600 underline">{label}</Link>
    </p>
  );
}

function Paywall() {
  return (
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
  );
}
