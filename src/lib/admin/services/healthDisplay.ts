import type { UserHealthStatus } from "./userHealth";

/**
 * CHỈ đổi TEXT hiển thị cho gọn — không phải rule/trạng thái mới. Trạng thái
 * (health.status) và lý do (health.reason) vẫn 100% do computeUserHealth()
 * (userHealth.ts, không sửa file đó) quyết định. File này chỉ ánh xạ status
 * → nhãn ngắn dùng chung cho /admin/users và /admin/users/[id] để 2 nơi luôn
 * hiển thị cùng 1 chữ cho cùng 1 status (yêu cầu consistency).
 *
 * showReason: chỉ hiện dòng lý do nhỏ bên dưới badge cho trạng thái thực sự
 * có vấn đề (inactive/stuck/needs_support) — new/healthy/completed không cần
 * lý do vì "không có vấn đề".
 */
export const HEALTH_DISPLAY: Record<UserHealthStatus, { label: string; showReason: boolean; className: string }> = {
  new: { label: "Mới", showReason: false, className: "bg-sky-50 text-sky-700" },
  healthy: { label: "Khỏe", showReason: false, className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Hoàn thành", showReason: false, className: "bg-violet-50 text-violet-700" },
  inactive: { label: "Inactive", showReason: true, className: "bg-amber-50 text-amber-700" },
  stuck: { label: "Stuck", showReason: true, className: "bg-orange-50 text-orange-700" },
  needs_support: { label: "Cần hỗ trợ", showReason: true, className: "bg-red-50 text-red-700" },
};
