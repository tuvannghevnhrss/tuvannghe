export const ADMIN_ROLES = ["super_admin", "ops_manager", "finance", "content", "ai_ops", "support"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  ops_manager: "Quản lý vận hành",
  finance: "Tài chính",
  content: "Nội dung",
  ai_ops: "AI Operations",
  support: "Hỗ trợ",
};

export type AdminModule =
  | "dashboard"
  | "analytics"
  | "users"
  | "payments"
  | "tests"
  | "interview"
  | "questions"
  | "prompts"
  | "ai_usage"
  | "jobs"
  | "audit_logs"
  | "database"
  | "settings"
  | "notifications";

export type PermLevel = "none" | "view" | "edit" | "full";

const LEVEL_RANK: Record<PermLevel, number> = { none: 0, view: 1, edit: 2, full: 3 };

/**
 * Ma trận quyền theo module — nguồn sự thật duy nhất, dùng cho cả
 * sidebar (ẩn/hiện module) lẫn requireAdmin() ở API route.
 * Khớp bảng permission trong tài liệu thiết kế Back Office, mục 06.
 */
const MATRIX: Record<AdminModule, Record<AdminRole, PermLevel>> = {
  dashboard:      { super_admin: "full", ops_manager: "view", finance: "view", content: "view", ai_ops: "view", support: "view" },
  analytics:      { super_admin: "full", ops_manager: "view", finance: "view", content: "view", ai_ops: "view", support: "view" },
  users:          { super_admin: "full", ops_manager: "edit", finance: "view", content: "none", ai_ops: "none", support: "view" },
  payments:       { super_admin: "full", ops_manager: "view", finance: "full", content: "none", ai_ops: "none", support: "view" },
  tests:          { super_admin: "full", ops_manager: "edit", finance: "none", content: "full", ai_ops: "none", support: "view" },
  interview:      { super_admin: "full", ops_manager: "full", finance: "none", content: "edit", ai_ops: "view", support: "view" },
  questions:      { super_admin: "full", ops_manager: "edit", finance: "none", content: "full", ai_ops: "none", support: "none" },
  prompts:        { super_admin: "full", ops_manager: "none", finance: "none", content: "none", ai_ops: "full", support: "none" },
  ai_usage:       { super_admin: "full", ops_manager: "view", finance: "view", content: "none", ai_ops: "full", support: "none" },
  jobs:           { super_admin: "full", ops_manager: "edit", finance: "none", content: "full", ai_ops: "none", support: "none" },
  audit_logs:     { super_admin: "full", ops_manager: "none", finance: "none", content: "none", ai_ops: "none", support: "none" },
  database:       { super_admin: "full", ops_manager: "none", finance: "none", content: "none", ai_ops: "none", support: "none" },
  settings:       { super_admin: "full", ops_manager: "none", finance: "none", content: "none", ai_ops: "none", support: "none" },
  notifications:  { super_admin: "full", ops_manager: "edit", finance: "view", content: "view", ai_ops: "view", support: "view" },
};

export function levelFor(role: AdminRole, mod: AdminModule): PermLevel {
  return MATRIX[mod][role];
}

/** true nếu role có quyền >= required cho module đó. Mặc định yêu cầu tối thiểu "view". */
export function can(role: AdminRole, mod: AdminModule, required: Exclude<PermLevel, "none"> = "view"): boolean {
  return LEVEL_RANK[levelFor(role, mod)] >= LEVEL_RANK[required];
}
