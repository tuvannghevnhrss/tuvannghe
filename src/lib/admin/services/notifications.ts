import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import { AI_DAILY_BUDGET_USD, getAiUsageSummary } from "./aiUsage";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  channel: string;
  readAt: string | null;
  createdAt: string;
};

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
function startOfTodayVN(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const midnightVN = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  return new Date(midnightVN.getTime() - VN_OFFSET_MS).toISOString();
}

function toRow(n: any): NotificationRow {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    channel: n.channel,
    readAt: n.read_at,
    createdAt: n.created_at,
  };
}

/** Chỉ lấy notification nội bộ team admin (user_id null) — chưa có UI phía user trong M4. */
export async function listNotifications(opts: {
  onlyUnread?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ notifications: NotificationRow[]; total: number; unreadCount: number }> {
  const supabase = createSupabaseAdminClient();
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 30;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (opts.onlyUnread) query = query.is("read_at", null);

  const [{ data, count, error }, unreadRes] = await Promise.all([
    query,
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("user_id", null).is("read_at", null),
  ]);
  if (error) throw new Error(error.message);

  return {
    notifications: ((data ?? []) as any[]).map(toRow),
    total: count ?? 0,
    unreadCount: unreadRes.count ?? 0,
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("user_id", null).is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("user_id", null)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}

async function createNotification(input: { type: string; title: string; body?: string; link?: string; channel?: "in_app" | "email" }) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("notifications").insert({
    user_id: null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    channel: input.channel ?? "in_app",
  });
}

async function hasRecentNotification(type: string, sinceISO: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("type", type).gte("created_at", sinceISO);
  return (count ?? 0) > 0;
}

async function notifyAdminsByEmail(subject: string, text: string) {
  const recipients = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) return;

  const from = process.env.SENDGRID_FROM || "Back Office <no-reply@example.com>";
  try {
    await sendMail({ to: recipients, from, subject, text });
  } catch (err) {
    console.error("notifyAdminsByEmail failed:", err instanceof Error ? err.message : err);
  }
}

/**
 * Kiểm tra một số điều kiện vận hành và tạo notification nếu cần. Chạy theo
 * kiểu "pull" — được gọi khi trang Dashboard/Notifications tải, chưa dùng
 * cron (rollup định kỳ thật sự là việc của M6, xem mục 25/27 tài liệu thiết kế).
 */
export async function checkOperationalAlerts(): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // 1) Chi phí AI vượt ngân sách ngày — tối đa 1 lần/ngày, có gửi email cho ADMIN_EMAILS.
  const todayStart = startOfTodayVN();
  if (!(await hasRecentNotification("ai_budget_exceeded", todayStart))) {
    const usage = await getAiUsageSummary();
    if (usage.costToday > AI_DAILY_BUDGET_USD) {
      await createNotification({
        type: "ai_budget_exceeded",
        title: `Chi phí AI hôm nay đã vượt $${AI_DAILY_BUDGET_USD}`,
        body: `Hiện tại: $${usage.costToday.toFixed(2)} từ ${usage.callsToday} lượt gọi.`,
        link: "/admin/ai-usage",
        channel: "email",
      });
      await notifyAdminsByEmail(
        "[Cảnh báo] Chi phí AI vượt ngân sách ngày",
        `Chi phí AI hôm nay: $${usage.costToday.toFixed(2)} (ngân sách $${AI_DAILY_BUDGET_USD}/ngày). Xem chi tiết: /admin/ai-usage`
      );
    }
  }

  // 2) Giao dịch pending quá 30 phút — throttle 2 giờ/lần, chỉ in-app (tránh spam email).
  const throttleSince = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  if (!(await hasRecentNotification("payments_pending", throttleSince))) {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("created_at", thirtyMinAgo);
    if ((count ?? 0) > 0) {
      await createNotification({
        type: "payments_pending",
        title: `${count} giao dịch đang chờ xử lý quá 30 phút`,
        link: "/admin/payments?status=pending",
        channel: "in_app",
      });
    }
  }
}
