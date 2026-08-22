import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Trang quản trị tuyển dụng đã chuyển sang Back Office chung tại /admin/jobs
 * (xem tài liệu thiết kế Back Office, mục 03 + lộ trình M1). Giữ redirect ở
 * đây để không phá bookmark cũ — việc gác quyền nằm ở /admin/jobs.
 */
export default function JobsAdminRedirect() {
  redirect("/admin/jobs");
}
