import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResolvedPrompt = { template: string; version: number | null };

/**
 * Đọc bản "live" mới nhất của 1 prompt key (Prompt Management, /admin/prompts).
 * Luôn có fallback bắt buộc — thiếu bản ghi hoặc lỗi DB không được phép làm
 * vỡ tính năng AI đang dùng prompt này (xem mục 16 tài liệu thiết kế Back Office).
 */
export async function resolvePrompt(key: string, fallback: string): Promise<ResolvedPrompt> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("prompts")
      .select("template, version")
      .eq("key", key)
      .eq("status", "live")
      .maybeSingle();
    if (data?.template) return { template: data.template as string, version: data.version as number };
  } catch (err) {
    console.error("resolvePrompt failed:", err instanceof Error ? err.message : err);
  }
  return { template: fallback, version: null };
}
