// -----------------------------------------------------------------------------
// src/app/profile/page.tsx
// -----------------------------------------------------------------------------
import { cookies } from "next/headers";
import Link        from "next/link";

import StepTabs     from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadar";
import OptionsTab   from "@/components/OptionsTab";
import FocusTab     from "@/components/FocusTab";
import PlanTab      from "@/components/PlanTab";

import { MBTI_MAP }    from "@/lib/mbtiDescriptions";
import { HOLLAND_MAP } from "@/lib/hollandDescriptions";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database }               from "@/types/supabase";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2 ▸ Hồ sơ -------------------------------------------------------------- */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type, holland_profile, knowdell_summary, suggested_jobs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3 ▸ Các gói đã thanh toán --------------------------------------------- */
  const { data: payments } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", "paid");

  const paidSet    = new Set((payments ?? []).map(p => p.product));
  const canAnalyse = ["mbti", "holland", "knowdell"].every(p => paidSet.has(p));

  /* 4 ▸ Mục tiêu, hành động ------------------------------------------------ */
  const [{ data: goal }, { data: actions }] = await Promise.all([
    supabase.from("career_goals")
      .select("what, why")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("career_actions")
      .select("*")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  /* 5 ▸ Knowdell ----------------------------------------------------------- */
  const kb          = profile.knowdell_summary ?? {};
  const valuesVI    = kb.values    ?? [];
  const skillsVI    = kb.skills    ?? [];
  const interestsVI = kb.interests ?? [];

  /* 6 ▸ Holland ------------------------------------------------------------ */
  type Radar = { name: string; score: number };
  let hollandRadar : Radar[]   = [];
  let hollCode     : string | null = null;

  if (profile.holland_profile) {
    hollandRadar = Object.entries(profile.holland_profile).map(
      ([name, score]) => ({ name, score: score as number })
    );
    hollCode = hollandRadar
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(o => o.name)
      .join("");
  }

  /** Trả về mảng gộp & loại trùng cho mã Holland ghép 2-3 ký tự */
  function merge <T extends string>(
    getter: (k: keyof typeof HOLLAND_MAP) => readonly T[] | undefined
  ): T[] {
    if (!hollCode) return [];
    return [...new Set(
      hollCode.split("").flatMap(
        c => getter(c as keyof typeof HOLLAND_MAP) ?? []
      )
    )];
  }

  const hollandIntro =
    hollCode?.split("")
      .map(c => HOLLAND_MAP[c as keyof typeof HOLLAND_MAP]?.intro)
      .filter(Boolean)
      .join(" | ") ?? "";

  const hTraits       = merge(k => HOLLAND_MAP[k]?.traits);
  const hStrengths    = merge(k => HOLLAND_MAP[k]?.strengths);
  const hWeaknesses   = merge(k => HOLLAND_MAP[k]?.weaknesses);
  const hImprovements = merge(k => HOLLAND_MAP[k]?.improvements);
  const hCareers      = merge(k => HOLLAND_MAP[k]?.careers);

  /* 7 ▸ MBTI -------------------------------------------------------------- */
  const mbtiCode : string | null = profile.mbti_type ?? null;
  const mbtiInfo = mbtiCode ? MBTI_MAP[mbtiCode as keyof typeof MBTI_MAP] : undefined;

  /* ───────────── RENDER ───────────── */
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-20">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề nghiệp</h1>
      <StepTabs current={step} />

      {/* TAB 1 – Đặc tính */}
      {step === "trait" && (
        <section className="space-y-8">
          {/* ── MBTI ─────────────────────────────────────────────── */}
          <TraitCard title="MBTI">
            {mbtiCode ? (
              <>
                <Header code={mbtiCode} intro={mbtiInfo?.intro} />
                <TraitGrid
                  traits={[]}
                  strengths={mbtiInfo?.strengths}
                  weaknesses={mbtiInfo?.flaws}
                  careers={mbtiInfo?.careers}
                  improvements={[]}
                  labels={["💪 Thế mạnh", "⚠️ Điểm yếu", "🎯 Nghề phù hợp"]}
                />
              </>
            ) : (
              <EmptyLink label="MBTI" href="/mbti" />
            )}
          </TraitCard>

          {/* ── Holland ─────────────────────────────────────────── */}
          <TraitCard title="Holland">
            {hollCode ? (
              <>
                <Header code={hollCode} intro={hollandIntro} />
                <TraitGrid
                  traits={hTraits}
                  strengths={hStrengths}
                  weaknesses={hWeaknesses}
                  improvements={hImprovements}
                  careers={hCareers}
                />
                {hollandRadar.length > 0 && (
                  <div className="mt-6">
                    <HollandRadar data={hollandRadar} />
                  </div>
                )}
              </>
            ) : (
              <EmptyLink label="Holland" href="/holland" />
            )}
          </TraitCard>

          {/* ── Knowdell ─────────────────────────────────────────── */}
          <TraitCard title="Knowdell">
            {valuesVI.length || skillsVI.length || interestsVI.length ? (
              <TraitGrid
                strengths={valuesVI}
                weaknesses={skillsVI}
                careers={interestsVI}
                labels={[
                  "💎 Giá trị cốt lõi",
                  "🛠 Kỹ năng động lực",
                  "🎈 Sở thích nổi bật",
                ]}
              />
            ) : (
              <EmptyLink label="Knowdell" href="/knowdell" />
            )}
          </TraitCard>
        </section>
      )}

      {/* TAB 2, 3, 4 giữ nguyên logic gốc */}
      {step === "options" && (
        canAnalyse ? (
          <OptionsTab
            mbti={mbtiCode}
            holland={hollCode}
            knowdell={profile.knowdell_summary}
            initialJobs={profile.suggested_jobs ?? []}
          />
        ) : <Paywall />
      )}

      {step === "focus" && <FocusTab existingGoal={goal ?? null} />}
      {step === "plan"  && <PlanTab  actions={actions ?? []} />}
    </div>
  );
}

/* ---------- Re-usable blocks ---------- */

function TraitCard({
  title,
  children,
  className = "",
}: React.PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <div className={`space-y-2 rounded-lg border bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Header({ code, intro }: { code: string; intro?: string }) {
  return (
    <>
      <p className="text-2xl font-bold">{code}</p>
      {intro && <p className="text-sm leading-relaxed">{intro}</p>}
    </>
  );
}

/** hiển thị list – nhãn tự động hoặc tuỳ truyền qua props */
function TraitGrid({
  traits,
  strengths,
  weaknesses,
  improvements,
  careers,
  labels = [
    "🔎 Đặc trưng",
    "💪 Thế mạnh",
    "⚠️ Điểm yếu",
    "🛠 Cần cải thiện",
    "🎯 Nghề phù hợp",
  ],
}: {
  traits?: string[];
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  careers?: string[];
  labels?: string[];
}) {
  /** bỏ “grid grid-cols-3” → đổi thành khối dọc */
  return (
    <div className="space-y-6">                           {/* 👈 thay đổi duy nhất */}
      {[
        traits,
        strengths,
        weaknesses,
        improvements,
        careers,
      ].map(
        (items, i) =>
          items?.length && (
            <div key={i}>
              <h4 className="font-semibold mb-1">{labels[i]}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                {items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
}

function Block({ title, list }: { title: string; list: string[] }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold flex items-center gap-1">{title}</h3>
      <ul className="list-disc list-inside">
        {list.map(s => <li key={s}>{s}</li>)}
      </ul>
    </div>
  );
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
