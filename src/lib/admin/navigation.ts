import type { AdminModule } from "./permissions";

export type NavStatus = "live" | "planned";

export type NavItem = {
  label: string;
  href: string;
  module: AdminModule;
  status: NavStatus;
};

export type NavGroup = { title?: string; items: NavItem[] };

/**
 * Nguồn sự thật cho sidebar. `status: "planned"` render thành mục vô hiệu hoá
 * trỏ tới /admin/coming-soon — cập nhật thành "live" đúng lúc module đó được triển khai
 * (xem lộ trình milestone M0–M6 trong tài liệu thiết kế Back Office).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/admin", module: "dashboard", status: "live" }],
  },
  {
    title: "Vận hành",
    items: [
      { label: "Người dùng", href: "/admin/users", module: "users", status: "live" },
      { label: "Thanh toán", href: "/admin/payments", module: "payments", status: "live" },
      { label: "Trắc nghiệm nghề nghiệp", href: "/admin/tests", module: "tests", status: "live" },
      { label: "Phỏng vấn AI", href: "/admin/interview", module: "interview", status: "live" },
      { label: "Ngân hàng câu hỏi", href: "/admin/questions", module: "questions", status: "live" },
      { label: "Tuyển dụng", href: "/admin/jobs", module: "jobs", status: "live" },
    ],
  },
  {
    title: "AI Operations",
    items: [
      { label: "Quản lý Prompt", href: "/admin/prompts", module: "prompts", status: "live" },
      { label: "Chi phí AI", href: "/admin/ai-usage", module: "ai_usage", status: "live" },
    ],
  },
  {
    title: "Insight",
    items: [
      { label: "Analytics", href: "/admin/analytics", module: "analytics", status: "live" },
      { label: "Nhật ký thao tác", href: "/admin/audit-logs", module: "audit_logs", status: "live" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { label: "Thông báo", href: "/admin/notifications", module: "notifications", status: "live" },
      { label: "Database Explorer", href: "/admin/database", module: "database", status: "live" },
      { label: "Cài đặt hệ thống", href: "/admin/settings", module: "settings", status: "live" },
    ],
  },
];
