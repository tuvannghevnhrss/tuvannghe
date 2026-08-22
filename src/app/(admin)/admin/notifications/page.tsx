import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { checkOperationalAlerts, listNotifications } from "@/lib/admin/services/notifications";
import { MarkAllReadButton, MarkReadButton } from "@/components/admin/notifications/NotificationActions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ unread?: string; page?: string }> };

const TYPE_LABEL: Record<string, string> = {
  ai_budget_exceeded: "Chi phí AI vượt ngân sách",
  payments_pending: "Giao dịch chờ xử lý",
};

export default async function AdminNotificationsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "notifications", "view")) notFound();

  await checkOperationalAlerts();

  const canEdit = can(admin.role, "notifications", "edit");
  const { unread, page: pageStr } = await searchParams;
  const onlyUnread = unread === "1";
  const page = Math.max(1, Number(pageStr) || 1);
  const { notifications, total, unreadCount } = await listNotifications({ onlyUnread, page, pageSize: 30 });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Thông báo ({unreadCount} chưa đọc)</h1>
        {canEdit && unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <Link href="/admin/notifications" className={`rounded-full px-3 py-1.5 ${!onlyUnread ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
          Tất cả
        </Link>
        <Link href="/admin/notifications?unread=1" className={`rounded-full px-3 py-1.5 ${onlyUnread ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
          Chưa đọc
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`rounded-lg border p-4 text-sm ${n.readAt ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </div>
                <p className="mt-1 font-medium text-slate-900">{n.title}</p>
                {n.body && <p className="mt-0.5 text-slate-600">{n.body}</p>}
                {n.link && (
                  <Link href={n.link} className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline">
                    Xem chi tiết →
                  </Link>
                )}
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
              {canEdit && !n.readAt && <MarkReadButton id={n.id} />}
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Không có thông báo nào.</p>}
      </div>

      {total > 30 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/admin/notifications?${onlyUnread ? "unread=1&" : ""}page=${page - 1}`} className="text-emerald-700 hover:underline">
              ← Trước
            </Link>
          )}
          {page * 30 < total && (
            <Link href={`/admin/notifications?${onlyUnread ? "unread=1&" : ""}page=${page + 1}`} className="text-emerald-700 hover:underline">
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
