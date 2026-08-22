import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Đọc trạng thái 1 feature flag — dùng được từ runtime code ngoài admin
 * (vd /api/payments/checkout kiểm tra maintenance_mode). Luôn có fallback:
 * lỗi DB hoặc thiếu bản ghi không được phép chặn nhầm tính năng đang chạy.
 */
export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    if (data) return Boolean((data as { enabled: boolean }).enabled);
  } catch (err) {
    console.error("isFeatureEnabled failed:", err instanceof Error ? err.message : err);
  }
  return fallback;
}
