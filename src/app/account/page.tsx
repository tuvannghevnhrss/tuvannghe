export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Cog6ToothIcon,
  GiftIcon,
  HeartIcon,
  MicrophoneIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInterviewAccess } from "@/app/api/interview/_lib/access";
import ProductCard from "@/components/account/ProductCard";

const PRODUCT_LABEL: Record<string, string> = {
  mbti: "MBTI",
  holland: "Holland",
  knowdell: "Giá trị bản thân",
  interview_starter: "Phỏng vấn AI — Khởi động",
  interview_pro: "Phỏng vấn AI — Luyện tập",
  interview_premium: "Phỏng vấn AI — Tăng tốc",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: "Đã thanh toán",
  pending: "Đang chờ thanh toán",
};

function formatVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const JOURNEY_NUMERALS = ["①", "②", "③", "④", "⑤", "⑥"];

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup?redirectedFrom=/account");

  const [profileRes, careerRes, paymentsRes, goalRes, actionsRes, access] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("career_profiles")
      .select("mbti_type, holland_profile, knowdell, knowdell_summary")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, product, status, amount, amount_paid, amount_due, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("career_goal").select("job, goals").eq("user_id", user.id).maybeSingle(),
    supabase.from("career_actions").select("id").eq("user_id", user.id),
    getInterviewAccess(user.id),
  ]);

  const profile = profileRes.data;
  const career = careerRes.data;
  const payments = paymentsRes.data ?? [];
  const goal = goalRes.data;
  const actions = actionsRes.data ?? [];

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Tài khoản";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const joinDate = user.created_at ? formatDate(user.created_at) : null;
  const emailVerified = Boolean(user.email_confirmed_at);

  // Cùng logic đã dùng ở /profile (paidSet từ bảng payments, status="paid") —
  // không tính lại theo cách khác để tránh 2 nguồn sự thật lệch nhau.
  const paidSet = new Set(payments.filter((p) => p.status === "paid").map((p) => p.product));
  const hollandOwned = paidSet.has("holland");
  const knowdellOwned = paidSet.has("knowdell");
  const havePaidCombo = hollandOwned && knowdellOwned;

  const hasMbti = Boolean(career?.mbti_type);

  let hollandCode: string | null = null;
  if (career?.holland_profile) {
    const entries = Object.entries(career.holland_profile as Record<string, number>);
    hollandCode = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([letter]) => letter)
      .join("");
  }

  const kb = (career?.knowdell as { values?: unknown[]; skills?: unknown[]; interests?: unknown[] } | null) ?? {};
  const hasKnowdell = Boolean(kb.values?.length || kb.skills?.length || kb.interests?.length);
  const hasSummary = typeof career?.knowdell_summary === "string" && career.knowdell_summary.trim().length > 0;
  const hasGoal = Boolean(goal?.job || goal?.goals);
  const hasPlan = actions.length > 0;
  const comboDoneCount = [hasMbti, Boolean(hollandCode), hasKnowdell].filter(Boolean).length;

  // ── Hành trình hướng nghiệp (6 bước, tóm tắt — không copy UI /profile) ──
  const journeySteps = [
    { label: "MBTI", done: hasMbti },
    { label: "Holland", done: Boolean(hollandCode) },
    { label: "Giá trị bản thân", done: hasKnowdell },
    { label: "Gợi ý nghề", done: hasSummary },
    { label: "Mục tiêu", done: hasGoal },
    { label: "Kế hoạch", done: hasPlan },
  ];
  const journeyDoneCount = journeySteps.filter((s) => s.done).length;

  // ── Bước tiếp theo — theo đúng thứ tự phụ thuộc thật, ẩn nếu không còn gì
  // để gợi ý (không mock, không tự bịa bước tiếp theo). ──
  const nextStep = !hasMbti
    ? {
        title: "Bạn chưa bắt đầu hành trình hướng nghiệp.",
        description: "MBTI là điểm khởi đầu phù hợp nhất để hiểu bản thân trước khi đi sâu hơn.",
        ctaLabel: "Làm MBTI",
        ctaHref: "/mbti",
      }
    : !hollandCode
      ? {
          title: "Bạn đã hoàn thành MBTI.",
          description: "Hãy thực hiện Holland để xác định nhóm nghề phù hợp hơn.",
          ctaLabel: "Làm Holland",
          ctaHref: "/holland",
        }
      : !hasKnowdell
        ? {
            title: "Bạn đã có MBTI và Holland.",
            description: "Hãy làm Giá trị bản thân để hiểu điều bạn ưu tiên khi chọn nghề.",
            ctaLabel: "Làm Giá trị bản thân",
            ctaHref: "/knowdell",
          }
        : !hasSummary
          ? {
              title: "Bạn đã đủ dữ liệu để xem gợi ý nghề phù hợp.",
              description: "Chạy phân tích kết hợp để hệ thống gợi ý hướng nghề nên ưu tiên.",
              ctaLabel: "Xem gợi ý nghề",
              ctaHref: "/profile?step=options",
            }
          : !hasGoal
            ? {
                title: "Bạn đã có định hướng nghề nghiệp.",
                description: "Hãy thiết lập mục tiêu nghề nghiệp cụ thể cho bước tiếp theo.",
                ctaLabel: "Thiết lập mục tiêu",
                ctaHref: "/profile?step=focus",
              }
            : !hasPlan
              ? {
                  title: "Bạn đã có mục tiêu nghề nghiệp.",
                  description: "Hãy lập kế hoạch hành động cụ thể để đạt mục tiêu đó.",
                  ctaLabel: "Lập kế hoạch",
                  ctaHref: "/profile?step=plan",
                }
              : !access.package
                ? {
                    title: "Bạn đã hoàn thành hồ sơ hướng nghiệp.",
                    description: "Bước tiếp theo là luyện phỏng vấn AI để sẵn sàng ứng tuyển.",
                    ctaLabel: "Xem gói phỏng vấn",
                    ctaHref: "/pricing",
                  }
                : null; // Không còn gì để gợi ý — ẩn section, không tự bịa.

  return (
    <main className="mx-auto max-w-[1080px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Tài khoản của tôi</h1>
        <p className="mt-2.5 text-base leading-7 text-slate-500">
          Quản lý thông tin cá nhân, sản phẩm, quyền sử dụng và bảo mật tài khoản.
        </p>
      </header>

      <div className="space-y-12">
        {/* ── 1. Tôi là ai? ───────────────────────────────────────────── */}
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thông tin tài khoản</h2>

          <div className="mt-5 flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-16 w-16 text-slate-300" />
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-400">Số điện thoại</dt>
              <dd className="mt-1 text-slate-700">Chưa cập nhật</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400">Ngày tham gia</dt>
              <dd className="mt-1 text-slate-700">{joinDate ?? "—"}</dd>
            </div>
          </dl>

          <button
            type="button"
            disabled
            title="Sắp ra mắt"
            className="mt-6 cursor-not-allowed rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"
          >
            Chỉnh sửa thông tin
          </button>
        </section>

        {/* ── 2. Tôi đang ở đâu trên hành trình? ──────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hành trình hướng nghiệp</h2>
            <span className="text-xs font-medium text-slate-400">{journeyDoneCount}/6 bước hoàn thành</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 rounded-[24px] border border-slate-100 bg-white/85 p-5">
            {journeySteps.map((step, index) => (
              <span
                key={step.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  step.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
                }`}
              >
                <span className="font-semibold">{JOURNEY_NUMERALS[index]}</span>
                {step.label}
                <span>{step.done ? "✓" : "○"}</span>
              </span>
            ))}
          </div>
        </section>

        {/* ── 3. Tôi nên làm gì tiếp theo? ─────────────────────────────── */}
        {nextStep && (
          <section className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Bước tiếp theo</h2>
            <p className="mt-3 text-base font-semibold text-slate-900">{nextStep.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{nextStep.description}</p>
            <Link
              href={nextStep.ctaHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {nextStep.ctaLabel} →
            </Link>
          </section>
        )}

        {/* ── 4. Tôi đang sở hữu sản phẩm nào? / 5. Còn bao nhiêu lượt? ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sản phẩm & quyền sử dụng</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProductCard
              icon={SparklesIcon}
              name="MBTI"
              description="Trắc nghiệm tính cách 16 nhóm"
              status={hasMbti ? "owned_completed" : "owned_unused"}
              resultLabel={hasMbti ? career!.mbti_type! : undefined}
              cta={hasMbti ? { label: "Xem kết quả", href: "/mbti/result" } : { label: "Làm bài đánh giá", href: "/mbti" }}
            />

            <ProductCard
              icon={PuzzlePieceIcon}
              name="Holland"
              description="Trắc nghiệm nhóm nghề RIASEC"
              status={!hollandOwned ? "not_owned" : hollandCode ? "owned_completed" : "owned_unused"}
              resultLabel={hollandCode ?? undefined}
              cta={
                !hollandOwned
                  ? { label: "Mua ngay", href: "/payment?product=holland" }
                  : hollandCode
                    ? { label: "Xem kết quả", href: "/holland/result" }
                    : { label: "Làm Holland", href: "/holland" }
              }
            />

            <ProductCard
              icon={HeartIcon}
              name="Giá trị bản thân"
              description="Giá trị, kỹ năng & sở thích nghề nghiệp (Knowdell)"
              status={!knowdellOwned ? "not_owned" : hasKnowdell ? "owned_completed" : "owned_unused"}
              cta={
                !knowdellOwned
                  ? { label: "Mua ngay", href: "/payment?product=knowdell" }
                  : hasKnowdell
                    ? { label: "Xem kết quả", href: "/profile?step=trait" }
                    : { label: "Làm bài đánh giá", href: "/knowdell" }
              }
            />

            {/* Sản phẩm nhóm — nổi bật hơn assessment đơn lẻ, chiếm trọn 1 hàng */}
            <ProductCard
              icon={MicrophoneIcon}
              name="Phỏng vấn AI"
              description={access.packageName ? `Gói ${access.packageName}` : "Luyện phỏng vấn với AI"}
              status={access.package ? "owned_active" : "not_owned"}
              featured
              cta={
                access.package
                  ? { label: "Luyện tập phỏng vấn", href: "/interview" }
                  : { label: "Xem gói phỏng vấn", href: "/pricing" }
              }
            >
              {access.package && (
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-emerald-100/70 pt-4">
                  {(["module1", "module2", "module3"] as const).map((key, index) => (
                    <div key={key} className="rounded-2xl bg-white/70 px-3 py-2.5 text-center">
                      <p className="text-xs text-slate-500">Module {index + 1}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {access.remaining[key] === null ? "Không giới hạn" : `${access.remaining[key]} lượt`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ProductCard>

            <ProductCard
              icon={GiftIcon}
              name="Combo Hướng nghiệp"
              description="Bao gồm MBTI · Holland · Giá trị bản thân"
              status={havePaidCombo ? "owned_active" : "not_owned"}
              featured
              cta={
                havePaidCombo
                  ? {
                      label: "Tiếp tục",
                      href: !hasMbti ? "/mbti" : !hollandCode ? "/holland" : !hasKnowdell ? "/knowdell" : "/profile?step=trait",
                    }
                  : { label: "Xem quyền lợi", href: "/pricing" }
              }
            >
              {havePaidCombo ? (
                <div className="mt-4 space-y-1.5 border-t border-emerald-100/70 pt-4 text-sm">
                  <p className={hasMbti ? "text-emerald-700" : "text-slate-400"}>{hasMbti ? "✓" : "○"} MBTI</p>
                  <p className={hollandCode ? "text-emerald-700" : "text-slate-400"}>{hollandCode ? "✓" : "○"} Holland</p>
                  <p className={hasKnowdell ? "text-emerald-700" : "text-slate-400"}>
                    {hasKnowdell ? "✓" : "○"} Giá trị bản thân
                  </p>
                  <p className="pt-1.5 text-xs font-medium text-slate-500">Tiến độ: {comboDoneCount}/3 hoàn thành</p>
                </div>
              ) : null}
            </ProductCard>
          </div>
        </section>

        {/* ── 6. Tôi đã mua gì? ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lịch sử mua hàng</h2>

          {payments.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-500">
              Chưa có lịch sử mua hàng.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/85">
              {payments.map((p) => {
                const amount = p.status === "paid" ? (p.amount_paid ?? p.amount) : p.amount_due;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {PRODUCT_LABEL[p.product] ?? p.product}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(p.created_at)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatVND(amount ?? 0)}</p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          p.status === "paid" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 7. Tôi quản lý bảo mật ở đâu? ───────────────────────────── */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <ShieldCheckIcon className="h-4 w-4" />
            Bảo mật
          </h2>

          <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-white/85 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">Email</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {emailVerified ? "✓ Đã xác thực" : "Chưa xác thực"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Mật khẩu</p>
                <p className="text-xs text-slate-500">••••••••</p>
              </div>
              <Link
                href="/auth/update-password"
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Đổi mật khẩu
              </Link>
            </div>
          </div>
        </section>

        {/* ── Cài đặt ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Cog6ToothIcon className="h-4 w-4" />
            Cài đặt
          </h2>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm leading-6 text-slate-500">
            Chưa có tuỳ chọn cài đặt nào khả dụng. Ngôn ngữ, thông báo email và các tuỳ chọn khác sẽ được bổ
            sung sau.
          </div>
        </section>
      </div>
    </main>
  );
}
