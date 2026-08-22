import OpenAI from "openai";
import { logAiUsage } from "@/lib/ai/usage";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** USD / 1K token — cập nhật khi OpenAI đổi giá hoặc đổi model. */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4.1": { input: 0.002, output: 0.008 },
  "gpt-4.1-mini": { input: 0.0004, output: 0.0016 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING[model];
  if (!rate) return 0;
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}

export type ChatCompletionMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatCompletionParams = {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  [key: string]: unknown;
};

export type AiCallMeta = {
  route: string;
  userId?: string | null;
  sessionId?: string | null;
  promptKey?: string | null;
  promptVersion?: number | null;
};

/**
 * Wrapper quanh openai.chat.completions.create — đo latency/token/chi phí,
 * ghi vào ai_usage_logs (lib/ai/usage.ts). Lỗi ghi log không làm vỡ lời gọi
 * AI chính; lỗi lời gọi AI vẫn được ghi lại (status "error") rồi ném tiếp ra
 * ngoài cho caller tự xử lý như cũ.
 */
export async function createChatCompletion(params: ChatCompletionParams, meta: AiCallMeta) {
  const startedAt = Date.now();
  try {
    const completion = await openai.chat.completions.create(params as Parameters<typeof openai.chat.completions.create>[0]);
    const latencyMs = Date.now() - startedAt;
    const usage = (completion as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage ?? {};
    const inputTokens = usage.prompt_tokens ?? 0;
    const outputTokens = usage.completion_tokens ?? 0;

    void logAiUsage({
      ...meta,
      model: params.model,
      provider: "openai",
      inputTokens,
      outputTokens,
      costUsd: estimateCost(params.model, inputTokens, outputTokens),
      latencyMs,
      status: "ok",
    });

    return completion as OpenAI.Chat.Completions.ChatCompletion;
  } catch (err) {
    void logAiUsage({
      ...meta,
      model: params.model,
      provider: "openai",
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
    });
    throw err;
  }
}
