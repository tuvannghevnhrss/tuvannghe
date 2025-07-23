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

/* ────────── helpers ────────── */
/** gom thành dict: { key ➜ vi } */
function toDict<T extends { [k: string]: any }>(
  rows: T[] | null,
  keyField: keyof T,
) {
  return Object.fromEntries(
    (rows ?? []).map((r) => [r[keyField] as string, r.vi as string]),
  );
}

/** item Knowdell → text (ưu tiên tra từ điển) */
function toText(
  arr: any[] | any | undefined,
  dicts: Record<string, string>[],
) {
  const out: string[] = [];
  const items = Array.isArray(arr) ? arr : arr ? [arr] : [];

  items.forEach((it) => {
    if (typeof it === "string") return out.push(it);

    for (const k of [
      "value_key",
      "skill_key",
      "interest_key",
      "value",
      "name_vi",
    ]) {
      if (it && it[k]) {
        const key = it[k] as string;
        const vi =
          dicts.reduce<string | undefined>(
            (acc, d) => acc ?? d[key],
            undefined,
          ) ?? key;
        return out.push(vi);
      }
    }
    const first = it && Object.values(it).find((v) => typeof v === "string");
    out.push(typeof first === "string" ? first : String(it));
  });

  return Array.from(new Set(out));
}

/* ────────── PAGE ────────── */
export default async function Profile({
  searchParams,
}: {
  searchParams?: { step?: string };
}) {
  const step = searchParams?.step ?? "trait";

  /* 1 ▸ auth */
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  /* 2 ▸ hồ sơ */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select(`
      mbti_type,
      holland_profile,
      knowdell_summary,
      knowdell,
      suggested_jobs
    `)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return <p className="p-6">Chưa có dữ liệu hồ sơ.</p>;

  /* 3 ▸ lookup dict (Knowdell) */
  const [valRows, skillRows, intRows] = await Promise.all([
    supabase.from("lookup_values").select("value_key, vi"),
    supabase.from("lookup_skills").select("skill_key , vi"),
    supabase.from("lookup_interests").select("interest_key, vi"),
  ]);
  const VALUE_DICT    = toDict(valRows.data,   "value_key");
  const SKILL_DICT    = toDict(skillRows.data, "skill_key");
  const INTEREST_DICT = toDict(intRows.data,   "interest_key");

  /* 4 ▸ Knowdell */
  const kb =
    profile.knowdell_summary ??
    // @ts-expect-error – field động
    profile.knowdell ??
    {};
  const valuesVI    = toText(kb.values,    [VALUE_DICT]);
  const skillsVI    = toText(kb.skills,    [SKILL_DICT]);
  const interestsVI = toText(kb.interests, [INTEREST_DICT]);
  
  const knowdellClean = {
    values:     valuesVI,
    skills:     skillsVI,
    interests:  interestsVI,
  };	


  /* 5 ▸ Holland */
  type Radar = { name: string; score: number };
  const hollandRadar: Radar[] = [];
  let hollCode: string | null = null;
  if (profile.holland_profile) {
    Object.entries(profile.holland_profile).forEach(([n, s]) =>
      hollandRadar.push({ name: n, score: s as number }),
    );
    hollCode = hollandRadar
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((o) => o.name)
      .join("");
  }
  const hollandSections = hollCode
    ? hollCode.split("").map((l) => ({
        code: l,
        info: HOLLAND_MAP[l as keyof typeof HOLLAND_MAP],
      }))
    : [];

  /* 6 ▸ MBTI */
  const mbtiCode: string | null = profile.mbti_type ?? null;
  const mbtiInfo = mbtiCode && MBTI_MAP[mbtiCode as keyof typeof MBTI_MAP];

  /* 7 ▸ thanh toán & quyền dùng tab Options */
  const { data: payments } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", "paid");
  const paidSet       = new Set((payments ?? []).map((p) => p.product));
  const haveResult    = !!profile.holland_profile && !!kb.interests;
  const havePaidCombo = ["holland", "knowdell"].every((p) => paidSet.has(p));
  const canAnalyse    = haveResult || havePaidCombo;

  /* 8 ▸ mục tiêu, hành động */
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

  /* ────────── render ────────── */
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-20">
      <h1 className="text-3xl font-bold">Hồ sơ Phát triển nghề nghiệp</h1>
      <StepTabs current={step} />

      {/* TAB 1 – Đặc tính */}
      {step === "trait" && (
        <section className="space-y-6">
          {/* MBTI */}
          <TraitCard title="MBTI">
            {mbtiCode ? (
              <>
                <Header code={mbtiCode} intro={mbtiInfo?.intro} />
                <TraitGrid
                  strengths={mbtiInfo?.strengths}
                  weaknesses={mbtiInfo?.flaws}
                  careers={mbtiInfo?.careers}
                  labels={["💪 Thế mạnh", "⚠️ Điểm yếu", "🎯 Nghề phù hợp"]}
                />
              </>
            ) : (
              <EmptyLink label="MBTI" href="/mbti" />
            )}
          </TraitCard>

          {/* Holland */}
          <TraitCard title="Holland">
            {hollCode ? (
              <>
                {hollandSections.map(
                  ({ code, info }) =>
                    info && (
                      <div key={code} className="mb-8 first:mt-0">
                        <Header code={code} intro={info.intro} />
                        <TraitGrid
                          traits={info.traits}
                          strengths={info.strengths}
                          weaknesses={info.weaknesses}
                          improvements={info.improvements}
                          careers={info.careers}
                        />
                      </div>
                    ),
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
          </TraitCard>

          {/* Knowdell */}
          <TraitCard title="Knowdell">
            {valuesVI.length || skillsVI.length || interestsVI.length ? (
              <TraitGrid
                strengths={valuesVI}
                weaknesses={skillsVI}
                careers={interestsVI}
                labels={[
                  "",
		  "💎 Giá trị cốt lõi",
                  "🛠 Kỹ năng động lực",
		  "",
                  "🎈 Sở thích nghề nghiệp",
                ]}
              />
            ) : (
              <EmptyLink label="Knowdell" href="/knowdell" />
            )}
          </TraitCard>
        </section>
      )}

      {/* TAB 2 – Lựa chọn nghề */}
      {step === "options" && (
        <OptionsTab
          holland={hollCode}
          knowdell={knowdellClean}
          canAnalyse={canAnalyse}
          initialJobs={profile.suggested_jobs ?? []}
        />
      )}

      {/* TAB 3 & 4 */}
      {step === "focus" && <FocusTab existingGoal={goal ?? null} />}
      {step === "plan" && <PlanTab actions={actions ?? []} />}
    </div>
  );
}

/* ---------- view helpers ---------- */
function TraitCard({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-3 rounded-lg border bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Header({ code, intro }: { code: string; intro?: string }) {
  return (
    <>
      <p className="text-2xl font-bold mb-1">{code}</p>
      {intro && <p className="text-sm leading-relaxed">{intro}</p>}
    </>
  );
}

/** Hiển thị 1-5 danh sách theo chiều dọc */
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
  traits?: any[];
  strengths?: any[];
  weaknesses?: any[];
  improvements?: any[];
  careers?: any[];
  labels?: string[];
}) {
  const lists = [
    toText(traits, []),
    toText(strengths, []),
    toText(weaknesses, []),
    toText(improvements, []),
    toText(careers, []),
  ];

  return (
    <div className="space-y-6">
      {lists.map(
        (items, i) =>
          items.length > 0 && (
            <div key={i}>
              <h4 className="mb-1 font-semibold">{labels[i] ?? ""}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
                {items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}

function EmptyLink({ label, href }: { label: string; href: string }) {
  return (
    <p className="italic text-gray-500">
      Chưa làm{" "}
      <Link href={href} className="text-indigo-600 underline">
        {label}
      </Link>
    </p>
  );
}
