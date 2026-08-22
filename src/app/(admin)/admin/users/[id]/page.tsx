import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import {
  getUserHeader,
  getUserCareer,
  getUserProducts,
  getUserInterviewSummary,
  getUserActivity,
  getUserHealthReport,
  type UserInterviewSummary,
  type ActivityItem,
} from "@/lib/admin/services/user360";
import type { UserHealth } from "@/lib/admin/services/userHealth";
import { HEALTH_DISPLAY } from "@/lib/admin/services/healthDisplay";
import { INTERVIEW_PACKAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "career", label: "Hướng nghiệp" },
  { key: "products", label: "Sản phẩm" },
  { key: "interview", label: "Interview" },
  { key: "activity", label: "Hoạt động" },
  { key: "support", label: "Hỗ trợ" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function AdminUserDetailPage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "users", "view")) notFound();

  const { id } = await params;
  const { tab: tabStr } = await searchParams;
  const tab = (TABS.some((t) => t.key === tabStr) ? tabStr : "overview") as TabKey;

  const header = await getUserHeader(id);
  if (!header) notFound();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-800">
          ← Người dùng
        </Link>
        <div className="mt-3 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
            {(header.fullName || header.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{header.fullName || header.email || header.id}</h1>
            <p className="text-sm text-slate-500">{header.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              Đăng ký {formatDate(header.createdAt)} · Hoạt động gần nhất {header.lastSignInAt ? formatDate(header.lastSignInAt) : "—"}
            </p>
          </div>
          <HealthBadgeAsync userId={id} />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/users/${id}?tab=${t.key}`}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab userId={id} />}
      {tab === "career" && <CareerTab userId={id} />}
      {tab === "products" && <ProductsTab userId={id} />}
      {tab === "interview" && <InterviewTab userId={id} />}
      {tab === "activity" && <ActivityTab userId={id} />}
      {tab === "support" && <SupportTab userId={id} />}
    </div>
  );
}

async function HealthBadgeAsync({ userId }: { userId: string }) {
  const health = await getUserHealthReport(userId);
  return <HealthBadge health={health} />;
}

function HealthBadge({ health }: { health: UserHealth }) {
  const display = HEALTH_DISPLAY[health.status];
  return (
    <div className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${display.className}`} title={health.reason}>
      {health.emoji} {display.label}
    </div>
  );
}

// ============================================================================
// TỔNG QUAN — thứ tự: cảnh báo (nếu có) → hành trình → sản phẩm → hoạt động
// gần nhất. Mục tiêu: Admin hiểu tình trạng user trong 10-20 giây.
// ============================================================================
async function OverviewTab({ userId }: { userId: string }) {
  const [career, products, health, activity] = await Promise.all([
    getUserCareer(userId),
    getUserProducts(userId),
    getUserHealthReport(userId),
    getUserActivity(userId),
  ]);

  const isBrandNew =
    !career.hasMbti && !career.hasHolland && !career.hasKnowdell && products.payments.length === 0 && !products.interviewAccess.package;

  const journeySteps: [string, "done" | "doing" | "none"][] = [
    ["MBTI", career.hasMbti ? "done" : "none"],
    ["Holland", career.hasHolland ? "done" : "none"],
    ["Giá trị bản thân", career.hasKnowdell ? "done" : "none"],
    ["Interview", products.interviewAccess.package ? "doing" : "none"],
  ];

  const needsAttention = health.status === "needs_support" || health.status === "stuck" || health.status === "inactive";

  return (
    <div className="space-y-6">
      <Section title={needsAttention ? "⚠️ Cần chú ý" : "Cần chú ý"}>
        {needsAttention ? (
          <p className="text-sm text-slate-700">
            {health.emoji} <span className="font-semibold">&ldquo;{health.reason}&rdquo;</span>
          </p>
        ) : (
          <p className="text-sm text-emerald-700">✓ Không có vấn đề cần xử lý</p>
        )}
      </Section>

      {isBrandNew ? (
        <Section title="Hành trình">
          <p className="text-sm text-slate-500">User chưa bắt đầu hành trình.</p>
        </Section>
      ) : (
        <Section title="Hành trình">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StepPill label="Đăng ký" state="done" />
            {journeySteps.map(([label, state]) => (
              <span key={label} className="flex items-center gap-2">
                <span className="text-slate-300">↓</span>
                <StepPill label={label} state={state} />
              </span>
            ))}
          </div>
          {products.havePaidCombo && (
            <p className="mt-2 text-xs text-emerald-700">✓ Đủ điều kiện Combo hướng nghiệp (đã mua Holland + Giá trị bản thân)</p>
          )}
        </Section>
      )}

      <Section title="Sản phẩm">
        {isBrandNew ? (
          <p className="text-sm text-slate-500">Chưa mua sản phẩm.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniCard label="MBTI" value={career.hasMbti ? "Đã sử dụng" : "Chưa làm"} />
            <MiniCard label="Holland" value={career.hasHolland ? `Đã hoàn thành (${career.hollandCode})` : products.paidProductSet.has("holland") ? "Đã mua, chưa hoàn thành" : "Chưa làm"} />
            <MiniCard label="Giá trị bản thân" value={career.hasKnowdell ? "Đã hoàn thành" : products.paidProductSet.has("knowdell") ? "Đã mua, chưa hoàn thành" : "Chưa làm"} />
          </div>
        )}
        {products.interviewAccess.package && (
          <p className="mt-3 text-sm text-slate-600">
            Gói Interview: <span className="font-semibold">{products.interviewAccess.packageName}</span> — M1{" "}
            {products.interviewAccess.used.module1}/{fmtLimit(products.interviewAccess.limits.module1)}, M2{" "}
            {products.interviewAccess.used.module2}/{fmtLimit(products.interviewAccess.limits.module2)}, M3{" "}
            {products.interviewAccess.used.module3}/{fmtLimit(products.interviewAccess.limits.module3)}
          </p>
        )}
      </Section>

      <Section title="Hoạt động gần nhất">
        {activity.length === 0 ? (
          <Empty text="Chưa có hoạt động." />
        ) : (
          <ul className="space-y-2">
            {activity.slice(0, 8).map((item, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm">
                <span className="w-32 shrink-0 text-xs text-slate-400">{formatDate(item.at)}</span>
                <span className="text-slate-700">{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function StepPill({ label, state }: { label: string; state: "done" | "doing" | "none" }) {
  const cls =
    state === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : state === "doing"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-slate-200 bg-slate-50 text-slate-400";
  const icon = state === "done" ? "✓" : state === "doing" ? "●" : "○";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium ${cls}`}>
      {label} {icon}
    </span>
  );
}

function fmtLimit(v: number | "unlimited") {
  return v === "unlimited" ? "∞" : v;
}

// ============================================================================
// HƯỚNG NGHIỆP
// ============================================================================
async function CareerTab({ userId }: { userId: string }) {
  const career = await getUserCareer(userId);
  return (
    <div className="space-y-6">
      <Section title="MBTI">
        {career.hasMbti ? (
          <p className="text-sm">
            Type: <span className="font-semibold">{career.mbtiCode}</span>
          </p>
        ) : (
          <Empty text="Chưa có kết quả." />
        )}
      </Section>

      <Section title="Holland">
        {career.hasHolland ? (
          <>
            <p className="text-sm">
              Top 3 nhóm: <span className="font-semibold">{career.hollandCode}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {career.hollandRadar
                .sort((a, b) => b.score - a.score)
                .map((r) => (
                  <span key={r.name} className="rounded-full bg-slate-100 px-2 py-1">
                    {r.name}: {r.score}
                  </span>
                ))}
            </div>
          </>
        ) : (
          <Empty text="Chưa có kết quả." />
        )}
      </Section>

      <Section title="Giá trị bản thân">
        {career.hasKnowdell ? (
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <ListBlock title="Giá trị cốt lõi" items={career.valuesVI} />
            <ListBlock title="Kỹ năng động lực" items={career.skillsVI} />
            <ListBlock title="Sở thích nghề nghiệp" items={career.interestsVI} />
          </div>
        ) : (
          <Empty text="Chưa có kết quả." />
        )}
      </Section>

      <Section title="Career profile">
        {career.hasSummary ? (
          <p className="whitespace-pre-line text-sm text-slate-700">{career.knowdellSummary}</p>
        ) : (
          <Empty text="Chưa có kết quả." />
        )}
        {career.hasGoal && career.goal && (
          <p className="mt-3 text-sm text-slate-700">
            Định hướng: <span className="font-semibold">{career.goal.job}</span>
          </p>
        )}
      </Section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{title}</p>
      {items.length ? (
        <ul className="mt-1 space-y-0.5">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-slate-400">—</p>
      )}
    </div>
  );
}

// ============================================================================
// SẢN PHẨM
// ============================================================================
async function ProductsTab({ userId }: { userId: string }) {
  const products = await getUserProducts(userId);
  const packageMeta = products.interviewAccess.package
    ? INTERVIEW_PACKAGES.find((p) => p.id === products.interviewAccess.package)
    : null;

  return (
    <div className="space-y-6">
      <Section title="Sản phẩm & Quota">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductCard title="MBTI" status={products.paidProductSet.has("mbti") || true ? "Miễn phí" : "—"} />
          <ProductCard title="Holland" status={products.paidProductSet.has("holland") ? "Đã mua" : "Chưa mua"} />
          <ProductCard title="Giá trị bản thân / Knowdell" status={products.paidProductSet.has("knowdell") ? "Đã mua" : "Chưa mua"} />
          <ProductCard title="Combo hướng nghiệp" status={products.havePaidCombo ? "Đã đủ điều kiện" : "Chưa đủ"} />
          {packageMeta && (
            <ProductCard
              title={`Interview ${packageMeta.name}`}
              status="Đã mua"
              extra={
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                  <div>M1: {products.interviewAccess.used.module1}/{fmtLimit(products.interviewAccess.limits.module1)}</div>
                  <div>M2: {products.interviewAccess.used.module2}/{fmtLimit(products.interviewAccess.limits.module2)}</div>
                  <div>M3: {products.interviewAccess.used.module3}/{fmtLimit(products.interviewAccess.limits.module3)}</div>
                </div>
              }
            />
          )}
        </div>
      </Section>

      <Section title="Lịch sử thanh toán">
        {products.payments.length === 0 ? (
          <Empty text="Chưa có giao dịch nào." />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-1.5 pr-4">Sản phẩm</th>
                <th className="py-1.5 pr-4">Mã đơn</th>
                <th className="py-1.5 pr-4">Số tiền</th>
                <th className="py-1.5 pr-4">Trạng thái</th>
                <th className="py-1.5 pr-4">Tạo lúc</th>
                <th className="py-1.5">Thanh toán lúc</th>
              </tr>
            </thead>
            <tbody>
              {products.payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4 font-medium">{p.product}</td>
                  <td className="py-1.5 pr-4 font-mono text-xs">{p.orderCode ?? "—"}</td>
                  <td className="py-1.5 pr-4">{p.amount.toLocaleString("vi-VN")}đ</td>
                  <td className="py-1.5 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-1.5 pr-4 text-slate-500">{formatDate(p.createdAt)}</td>
                  <td className="py-1.5 text-slate-500">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function ProductCard({ title, status, extra }: { title: string; status: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{status}</p>
      {extra}
    </div>
  );
}

// ============================================================================
// INTERVIEW
// ============================================================================
async function InterviewTab({ userId }: { userId: string }) {
  const access = await getUserProducts(userId);
  const summary = await getUserInterviewSummary(userId, access.interviewAccess);

  return (
    <div className="space-y-6">
      <Section title="Tổng quan">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniCard label="Tổng buổi" value={String(summary.totalSessions)} />
          <MiniCard label="Hoàn tất" value={String(summary.completedCount)} />
          <MiniCard label="Đang phân tích" value={String(summary.processingCount)} />
          <MiniCard label="Phân tích thất bại" value={String(summary.failedCount)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniCard label="Đang thực hiện" value={String(summary.draftOrRecordingCount)} />
          <MiniCard label="Điểm gần nhất" value={summary.latestScore !== null ? `${summary.latestScore}/100` : "Chưa có"} />
          <MiniCard label="Điểm trung bình" value={summary.averageScore !== null ? `${summary.averageScore}/100` : "Chưa có"} />
          <MiniCard
            label="Xu hướng"
            value={summary.trend === null ? "Chưa đủ dữ liệu" : `${summary.trend >= 0 ? "+" : ""}${summary.trend} điểm`}
          />
        </div>
      </Section>

      <Section title="Theo module">
        <div className="grid gap-3 sm:grid-cols-3">
          <ModuleCard title="Module 1" stat={summary.perModule.module1} />
          <ModuleCard title="Module 2" stat={summary.perModule.module2} />
          <ModuleCard title="Module 3" stat={summary.perModule.module3} />
        </div>
      </Section>

      <Section title="Buổi luyện gần nhất">
        {summary.recentSessions.length === 0 ? (
          <Empty text="Chưa có buổi luyện nào." />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-1.5 pr-4">Ngày</th>
                <th className="py-1.5 pr-4">Module</th>
                <th className="py-1.5 pr-4">Vai trò</th>
                <th className="py-1.5 pr-4">Kinh nghiệm</th>
                <th className="py-1.5 pr-4">Độ khó</th>
                <th className="py-1.5 pr-4">Trạng thái</th>
                <th className="py-1.5">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentSessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4 text-slate-500">{formatDate(s.startedAt)}</td>
                  <td className="py-1.5 pr-4">
                    <Link href={`/admin/interview/${s.id}`} className="text-emerald-700 hover:underline">
                      Module {s.moduleType === 1 ? 1 : s.moduleType === 3 ? 2 : s.moduleType === 2 ? 3 : s.moduleType}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-4">{s.role}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{s.level}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{s.difficulty}</td>
                  <td className="py-1.5 pr-4">
                    <StatusBadge status={s.status} kind="interview" />
                  </td>
                  <td className="py-1.5">{s.score !== null ? `${s.score}/100` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function ModuleCard({ title, stat }: { title: string; stat: UserInterviewSummary["perModule"]["module1"] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">
        Đã dùng {stat.used}/{fmtLimit(stat.limit)} · Còn {stat.remaining === null ? "∞" : stat.remaining}
      </p>
      <p className="text-sm text-slate-600">Số buổi: {stat.sessionCount}</p>
      <p className="text-sm text-slate-600">Điểm TB: {stat.averageScore !== null ? `${stat.averageScore}/100` : "Chưa có"}</p>
    </div>
  );
}

// ============================================================================
// HOẠT ĐỘNG
// ============================================================================
async function ActivityTab({ userId }: { userId: string }) {
  const items = await getUserActivity(userId);
  return (
    <Section title="Hoạt động gần đây">
      {items.length === 0 ? (
        <Empty text="Chưa có hoạt động." />
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <ActivityRow key={i} item={item} />
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-slate-400">
        Nguồn dữ liệu: payments, career_profiles, interview_sessions_v2 — tổng hợp trực tiếp, không có bảng audit/event riêng cho user.
      </p>
    </Section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="border-l-2 border-slate-200 pl-4">
      <p className="text-xs text-slate-400">{formatDate(item.at)}</p>
      <p className="text-sm font-medium text-slate-900">{item.title}</p>
      {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
    </li>
  );
}

// ============================================================================
// HỖ TRỢ
// ============================================================================
const PRIORITY_LABEL: Record<string, string> = {
  needs_support: "Cao",
  stuck: "Trung bình",
  inactive: "Thấp",
  new: "Không có",
  healthy: "Không có",
  completed: "Không có",
};

async function SupportTab({ userId }: { userId: string }) {
  const [health, header] = await Promise.all([getUserHealthReport(userId), getUserHeader(userId)]);
  const display = HEALTH_DISPLAY[health.status];

  return (
    <div className="space-y-6">
      <Section title={`${health.emoji} ${display.label.toUpperCase()}`}>
        <p className="text-sm text-slate-700">
          Lý do: <span className="font-medium">&ldquo;{health.reason}&rdquo;</span>
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MiniCard label="Mức độ ưu tiên" value={PRIORITY_LABEL[health.status] ?? "Không có"} />
          <MiniCard
            label="Hoạt động gần nhất"
            value={header?.lastSignInAt ? formatDate(header.lastSignInAt) : "Chưa có"}
          />
        </div>
      </Section>

      <Section title="Ghi chú nội bộ">
        <p className="text-sm text-slate-500">Ghi chú hỗ trợ sẽ được triển khai trong phase tiếp theo.</p>
      </Section>

      <Section title="Lịch sử hỗ trợ">
        <Empty text="Chưa có lịch sử hỗ trợ." />
      </Section>
    </div>
  );
}

// ============================================================================
// SHARED UI
// ============================================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

const PAYMENT_STATUS_LABEL: Record<string, string> = { paid: "Đã thanh toán", pending: "Đang chờ" };
// Không hiển thị status kỹ thuật ra Admin — map về label nghiệp vụ (Phần 8).
const INTERVIEW_STATUS_LABEL: Record<string, string> = {
  draft: "Đang thực hiện",
  recording: "Đang thực hiện",
  processing: "Đang phân tích",
  completed: "Hoàn tất",
  failed: "Phân tích thất bại",
};

function StatusBadge({ status, kind = "payment" }: { status: string; kind?: "payment" | "interview" }) {
  const colorMap: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    recording: "bg-sky-50 text-sky-700",
    processing: "bg-sky-50 text-sky-700",
    draft: "bg-slate-100 text-slate-600",
  };
  const label = kind === "interview" ? INTERVIEW_STATUS_LABEL[status] ?? status : PAYMENT_STATUS_LABEL[status] ?? status;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorMap[status] ?? "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
