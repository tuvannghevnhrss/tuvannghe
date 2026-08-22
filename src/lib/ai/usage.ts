import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AiUsageEntry = {
  route: string;
  userId?: string | null;
  sessionId?: string | null;
  promptKey?: string | null;
  promptVersion?: number | null;
  provider?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  status: "ok" | "error";
};

/**
 * Ghi 1 dòng ai_usage_logs. Không bao giờ throw ra ngoài — lỗi ghi log
 * quan sát không được phép làm vỡ lời gọi AI nghiệp vụ chính.
 */
export async function logAiUsage(entry: AiUsageEntry): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("ai_usage_logs").insert({
      user_id: entry.userId ?? null,
      session_id: entry.sessionId ?? null,
      route: entry.route,
      provider: entry.provider ?? "openai",
      model: entry.model,
      prompt_key: entry.promptKey ?? null,
      prompt_version: entry.promptVersion ?? null,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cost_usd: entry.costUsd,
      latency_ms: entry.latencyMs,
      status: entry.status,
    });
    if (error) console.error("logAiUsage failed:", error.message);
  } catch (err) {
    console.error("logAiUsage failed:", err instanceof Error ? err.message : err);
  }
}
