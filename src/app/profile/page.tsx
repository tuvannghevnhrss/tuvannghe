export const dynamic = "force-dynamic";

import Link from "next/link";
import nextDynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import StepTabs from "@/components/StepTabs";
import HollandRadar from "@/components/HollandRadarClient";

// Chỉ tải JS của tab đang mở (mỗi tab render tuỳ theo `step`) — tránh gộp
// cả 4 tab (kể cả recharts trong PlanTab/GanttMini) vào 1 bundle ban đầu.
const OptionsTab = nextDynamic(() => import("@/components/OptionsTab"));
const FocusTab = nextDynamic(() => import("@/components/FocusTab"));
const PlanTab = nextDynamic(() => import("@/components/PlanTab"));
import { MBTI_MAP } from "@/lib/mbtiDescriptions";
import { HOLLAND_MAP } from "@/lib/hollandDescriptions";
import { toText } from "@/lib/toText";

type StepKey = "trait" | "options" | "focus" | "plan";

function toDict<T extends Record<string, any>>(rows: T[] | null, key: keyof T) {
  return Object.fromEntries((rows ?? []).map((row) => [row[key] as string, row.vi]));
}

function getCurrentStep(raw: string | string[] | undefined): StepKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "options" || value === "focus" || value === "plan") return value;
  return "trait";
}

function progressState(flags: {
  hasMbti: boolean;
  hasHolland: boolean;
  hasKnowdell: boolean;
  hasSummary: boolean;
  hasGoal: boolean;
  hasPlan: boolean;
}) {
  if (!flags.hasMbti) {
    return {
      title: "Bạn chưa bắt đầu hành trình hướng nghiệp",
      description:
        "MBTI là điểm vào phù hợp nhất để mở hồ sơ và hiểu bản thân trước khi đi sâu hơn.",
      ctaLabel: "Bắt đầu với MBTI",
      ctaHref: "/mbti",
    };
  }

  if (!flags.hasHolland) {
    return {
      title: "Bạn đã có MBTI, bước tiếp theo là Holland",
      description:
        "Holland giúp chuyển từ hiểu tính cách sang hiểu nhóm nghề và môi trường công việc phù hợp.",
      ctaLabel: "Làm Holland",
      ctaHref: "/holland",
    };
  }

  if (!flags.hasKnowdell) {
    return {
      title: "Bạn đã có nền tảng định hướng, giờ cần làm rõ giá trị bản thân",
      description:
        "Knowdell giúp bạn hiểu điều mình ưu tiên khi chọn nghề, chọn công ty và xây lộ trình.",
      ctaLabel: "Làm Giá trị bản thân",
      ctaHref: "/knowdell",
    };
  }

  if (!flags.hasSummary) {
    return {
      title: "Bạn đã đủ dữ liệu để xem gợi ý nghề phù hợp",
      description:
        "Hãy chạy phân tích kết hợp để hệ thống gợi ý hướng nghề và công việc nên ưu tiên.",
      ctaLabel: "Xem gợi ý nghề",
      ctaHref: "/profile?step=options",
    };
  }

  if (!flags.hasGoal) {
    return {
      title: "Bạn đã có định hướng, giờ cần chốt mục tiêu nghề nghiệp",
      description:
        "Mục tiêu càng rõ thì kế hoạch hành động và phần luyện phỏng vấn càng chính xác.",
      ctaLabel: "Thiết lập mục tiêu",
      ctaHref: "/profile?step=focus",
    };
  }

  if (!flags.hasPlan) {
    return {
      title: "Bạn đã có mục tiêu, bước tiếp theo là kế hoạch hành động",
      description:
        "Chia nhỏ mục tiêu thành những việc cụ thể để chuyển từ định hướng sang hành động.",
      ctaLabel: "Lập kế hoạch",
      ctaHref: "/profile?step=plan",
    };
  }

  return {
    title: "Hồ sơ đã sẵn sàng, hãy chuyển sang luyện phỏng vấn AI",
    description:
      "Khi đã rõ mục tiêu và lộ trình, bước tiếp theo là luyện cách thể hiện bản thân trước nhà tuyển dụng.",
    ctaLabel: "Bắt đầu luyện phỏng vấn AI",
    ctaHref: "/interview",
  };
}

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const step = getCurrentStep(sp?.step);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="p-6">Vui lòng đăng nhập.</p>;

  const [
    profileRes,
    valuesRes,
    skillsRes,
    interestsRes,
    paymentsRes,
    goalRes,
    actionsRes,
  ] = await Promise.all([
    supabase
      .from("career_profiles")
      .select("mbti_type, holland_profile, knowdell_summary, knowdell, suggested_jobs")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("lookup_values").select("value_key, vi"),
    supabase.from("lookup_skills").select("skill_key, vi"),
    supabase.from("lookup_interests").select("interest_key, vi"),
    supabase.from("payments").select("product").eq("user_id", user.id).eq("status", "paid"),
    supabase
      .from("career_goal")
      .select("job, goals, activities, start_date, end_date, supporters")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("career_actions")
      .select("id, what, who, deadline, done")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  const profile = profileRes.data;

  if (!profile) {
    return (
      <DashboardShell>
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <SparklesIcon className="h-4 w-4" />
            Dashboard cá nhân
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Bạn chưa bắt đầu hồ sơ hướng nghiệp
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Đây sẽ là nơi lưu kết quả MBTI, Holland, Giá trị bản thân, mục tiêu và kế hoạch hành động.
            Bước đầu tiên phù hợp nhất là làm MBTI để mở hồ sơ.
          </p>
        </header>

        <NextStepCard
          title="Bắt đầu với MBTI để mở hành trình"
          description="Sau MBTI, bạn có thể làm tiếp Holland và Giá trị bản thân để nhận gợi ý nghề phù hợp hơn."
          ctaLabel="Bắt đầu với MBTI"
          ctaHref="/mbti"
          secondaryLabel="Xem hub hướng nghiệp"
          secondaryHref="/career"
        />

        <ProgressTimeline
          steps={[
            ["MBTI", false],
            ["Holland", false],
            ["Giá trị", false],
            ["Gợi ý nghề", false],
            ["Mục tiêu", false],
            ["Kế hoạch", false],
          ]}
        />
      </DashboardShell>
    );
  }

  const valueDict = toDict(valuesRes.data, "value_key");
  const skillDict = toDict(skillsRes.data, "skill_key");
  const interestDict = toDict(interestsRes.data, "interest_key");

  const kb = profile.knowdell ?? {};
  const valuesVI = toText(kb.values, [valueDict]);
  const skillsVI = toText(kb.skills, [skillDict]);
  const interestsVI = toText(kb.interests, [interestDict]);

  type Radar = { name: string; score: number };
  const hollandRadar: Radar[] = [];
  let hollandCode: string | null = null;

  if (profile.holland_profile) {
    Object.entries(profile.holland_profile).forEach(([name, score]) => {
      hollandRadar.push({ name, score: score as number });
    });

    hollandCode = [...hollandRadar]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.name)
      .join("");
  }

  const hollandSections = hollandCode
    ? hollandCode.split("").map((code) => ({
        code,
        info: HOLLAND_MAP[code as keyof typeof HOLLAND_MAP],
      }))
    : [];

  const mbtiCode: string | null = profile.mbti_type ?? null;
  const mbtiInfo = mbtiCode ? MBTI_MAP[mbtiCode as keyof typeof MBTI_MAP] : null;

  const paidSet = new Set((paymentsRes.data ?? []).map((item) => item.product));
  const hasResult = Boolean(hollandCode && interestsVI.length);
  const havePaidCombo = ["holland", "knowdell"].every((item) => paidSet.has(item));
  const canAnalyse = hasResult || havePaidCombo;
  const hasAnalysed =
    typeof profile.knowdell_summary === "string" && profile.knowdell_summary.trim().length > 0;

  const goal = goalRes.data ?? null;
  const actions = actionsRes.data ?? [];

  const flags = {
    hasMbti: Boolean(mbtiCode),
    hasHolland: Boolean(hollandCode),
    hasKnowdell: Boolean(valuesVI.length || skillsVI.length || interestsVI.length),
    hasSummary: hasAnalysed,
    hasGoal: Boolean(goal?.job || goal?.goals),
    hasPlan: actions.length > 0,
  };

  const progress = [
    flags.hasMbti,
    flags.hasHolland,
    flags.hasKnowdell,
    flags.hasSummary,
    flags.hasGoal,
    flags.hasPlan,
  ].filter(Boolean).length;
  const dashboardState = progressState(flags);
  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "bạn";

  return (
    <DashboardShell>
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <SparklesIcon className="h-4 w-4" />
            Dashboard cá nhân
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Hồ sơ hướng nghiệp của {displayName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Theo dõi kết quả đã có, bước tiếp theo và kế hoạch hành động trong một màn hình gọn hơn.
          </p>
        </div>
        <p className="text-sm font-semibold text-emerald-700">{progress}/6 bước đã hoàn thành</p>
      </header>

      <ProgressTimeline
        steps={[
          ["MBTI", flags.hasMbti],
          ["Holland", flags.hasHolland],
          ["Giá trị", flags.hasKnowdell],
          ["Gợi ý nghề", flags.hasSummary],
          ["Mục tiêu", flags.hasGoal],
          ["Kế hoạch", flags.hasPlan],
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="MBTI" value={mbtiCode ?? "Chưa có"} />
        <SummaryTile label="Holland" value={hollandCode ?? "Chưa có"} />
        <SummaryTile label="Giá trị nổi bật" value={valuesVI[0] ?? "Chưa có"} />
        <SummaryTile label="Mục tiêu hiện tại" value={goal?.job ?? "Chưa có"} />
      </section>

      <nav className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <StepTabs current={step} />
      </nav>

      {step === "trait" && (
        <section className="grid gap-5 lg:grid-cols-3">
          <CompactResultCard
            eyebrow="MBTI"
            title={mbtiCode ? `MBTI: ${mbtiCode}` : "Chưa có MBTI"}
            actionHref={!mbtiCode ? "/mbti" : undefined}
            actionLabel={!mbtiCode ? "Làm MBTI" : undefined}
          >
            {mbtiCode && mbtiInfo ? (
              <>
                <p className="text-sm leading-7 text-slate-600">{mbtiInfo.intro}</p>
                <PreviewList title="Thế mạnh nổi bật" items={mbtiInfo.strengths} limit={3} />
              </>
            ) : (
              <EmptyState text="MBTI là điểm bắt đầu để hiểu tính cách và phong cách làm việc." />
            )}
          </CompactResultCard>

          <CompactResultCard
            eyebrow="Holland"
            title={hollandCode ? `Holland: ${hollandCode}` : "Chưa có Holland"}
            actionHref={!hollandCode ? "/holland" : undefined}
            actionLabel={!hollandCode ? "Làm Holland" : undefined}
          >
            {hollandCode ? (
              <div className="space-y-4">
                {hollandRadar.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <HollandRadar data={hollandRadar} />
                  </div>
                )}
                <PreviewList
                  title="Nhóm nổi bật"
                  items={hollandSections.map(({ code, info }) =>
                    info?.intro ? `${code}: ${info.intro}` : code
                  )}
                  limit={3}
                />
              </div>
            ) : (
              <EmptyState text="Holland giúp xác định nhóm nghề và môi trường công việc phù hợp hơn." />
            )}
          </CompactResultCard>

          <CompactResultCard
            eyebrow="Giá trị bản thân"
            title={flags.hasKnowdell ? "Giá trị ưu tiên" : "Chưa có Giá trị bản thân"}
            actionHref={!flags.hasKnowdell ? "/knowdell" : undefined}
            actionLabel={!flags.hasKnowdell ? "Làm Knowdell" : undefined}
          >
            {flags.hasKnowdell ? (
              <div className="space-y-5">
                <PreviewList title="Giá trị cốt lõi" items={valuesVI} limit={5} />
                <PreviewList title="Kỹ năng động lực" items={skillsVI} limit={4} />
                <PreviewList title="Sở thích nghề nghiệp" items={interestsVI} limit={4} />
              </div>
            ) : (
              <EmptyState text="Phần này giúp làm rõ điều bạn ưu tiên khi chọn nghề và môi trường làm việc." />
            )}
          </CompactResultCard>
        </section>
      )}

      {step === "options" && (
        <Panel>
          <SectionIntro
            eyebrow="Gợi ý nghề phù hợp"
            title="Phân tích tổng hợp từ Holland và Giá trị bản thân"
            description="Phần này dùng dữ liệu hiện có để gợi ý hướng nghề và công việc phù hợp hơn với bạn."
          />
          <OptionsTab canAnalyse={canAnalyse} hasAnalysed={hasAnalysed} />
        </Panel>
      )}

      {step === "focus" && (
        <Panel>
          <SectionIntro
            eyebrow="Mục tiêu nghề nghiệp"
            title="Chốt mục tiêu rõ hơn trước khi lập kế hoạch"
            description="Từ kết quả hướng nghiệp, chọn nghề hoặc hướng đi bạn muốn ưu tiên để hệ thống hỗ trợ phần kế hoạch tốt hơn."
          />
          <FocusTab existing={goal} />
        </Panel>
      )}

      {step === "plan" && (
        <Panel>
          <SectionIntro
            eyebrow="Kế hoạch hành động"
            title="Chuyển từ định hướng sang việc cần làm"
            description="Khi mục tiêu đã rõ, phần này giúp bạn bẻ nhỏ thành các hành động cụ thể và theo dõi tiến độ."
          />
          <PlanTab actions={actions} />
        </Panel>
      )}

      <NextStepCard
        title={dashboardState.title}
        description={dashboardState.description}
        ctaLabel={dashboardState.ctaLabel}
        ctaHref={dashboardState.ctaHref}
        secondaryLabel="Mở Phỏng vấn AI"
        secondaryHref="/interview"
      />
    </DashboardShell>
  );
}

function DashboardShell({ children }: PropsWithChildren) {
  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_18%,#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Bước tiếp theo
          </p>
          <h2 className="mt-3 text-2xl font-bold">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {ctaLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProgressTimeline({ steps }: { steps: [string, boolean][] }) {
  const doneCount = steps.filter(([, done]) => done).length;

  return (
    <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-950">Tiến độ hành trình</h2>
        <span className="text-sm font-semibold text-emerald-700">
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-6">
        {steps.map(([label, done], index) => (
          <div
            key={label}
            className={`rounded-2xl border px-3 py-3 text-sm ${
              done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-emerald-600 text-white" : "bg-white text-slate-400"
                }`}
              >
                {index + 1}
              </span>
              <span className="font-semibold">{label}</span>
            </div>
            <p className="mt-2 text-xs">{done ? "Đã có" : "Chưa có"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 truncate text-xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

function Panel({ children }: PropsWithChildren) {
  return (
    <section className="space-y-6 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      {children}
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function CompactResultCard({
  eyebrow,
  title,
  children,
  actionHref,
  actionLabel,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}>) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">{title}</h2>
        </div>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </article>
  );
}

function PreviewList({
  title,
  items,
  limit,
}: {
  title: string;
  items?: string[];
  limit: number;
}) {
  const visible = (items ?? []).filter(Boolean).slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {visible.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="line-clamp-2">{item}</span>
          </li>
        ))}
      </ul>
      {(items?.length ?? 0) > limit && (
        <p className="mt-2 text-xs font-medium text-slate-400">
          +{(items?.length ?? 0) - limit} mục khác
        </p>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-500">
      {text}
    </div>
  );
}
