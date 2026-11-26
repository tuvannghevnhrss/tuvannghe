/** Gọi OpenAI với structured output + kiểm tra schema + ghi nhận usage. Không bao giờ để JSON sai định dạng lỗi âm thầm. */
import OpenAI from "openai";
import { z } from "zod";
import { estimateCostUsd, type M3Stage } from "./config";

export class M3Error extends Error {
  constructor(
    public code:
      | "OPENAI_KEY_MISSING"
      | "LLM_FAILED"
      | "LLM_INVALID_OUTPUT"
      | "COST_LIMIT"
      | "LLM_TIMEOUT",
    message: string,
  ) {
    super(message);
  }
}

export type UsageRecord = {
  stage: M3Stage;
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_usd: number;
  ok: boolean;
  error: string | null;
};

export type LlmContext = {
  /** Ghi nhận mỗi lần gọi (DB hoặc bộ nhớ khi chạy test/eval). */
  sink?: (r: UsageRecord) => void | Promise<void>;
  /** Ném M3Error("COST_LIMIT") nếu vượt trần chi phí của phiên. */
  assertBudget?: () => void | Promise<void>;
};

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new M3Error("OPENAI_KEY_MISSING", "Thiếu OPENAI_API_KEY trên máy chủ.");
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 1 });
  return client;
}

export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

const noTemperature = (model: string) => /^(gpt-5|o\d)/.test(model);

export async function callStructured<S extends z.ZodType>(opts: {
  stage: M3Stage;
  model: string;
  schemaName: string;
  schema: S;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  ctx?: LlmContext;
}): Promise<{ data: z.infer<S>; usage: UsageRecord }> {
  const { stage, model, schema, schemaName, system, user, ctx } = opts;
  await ctx?.assertBudget?.();
  const openai = getClient();
  const jsonSchema = toStrictJsonSchema(schema);

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const started = Date.now();
    let tokensIn = 0;
    let tokensOut = 0;
    try {
      const res = await openai.chat.completions.create({
        model,
        ...(noTemperature(model) ? {} : { temperature: opts.temperature ?? 0.3 }),
        ...(opts.maxTokens ? (noTemperature(model) ? { max_completion_tokens: opts.maxTokens } : { max_tokens: opts.maxTokens }) : {}),
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: attempt === 0 ? user : `${user}\n\n[Previous attempt was invalid: ${lastError}. Return valid JSON that follows the schema exactly.]`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, schema: jsonSchema, strict: true },
        },
      });
      tokensIn = res.usage?.prompt_tokens ?? 0;
      tokensOut = res.usage?.completion_tokens ?? 0;
      const content = res.choices[0]?.message?.content ?? "";
      const refusal = (res.choices[0]?.message as { refusal?: string | null } | undefined)?.refusal;
      if (refusal) throw new Error(`model refusal: ${refusal.slice(0, 120)}`);

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch {
        throw new Error("output is not valid JSON");
      }
      const parsed = schema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new Error(`schema validation failed: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      }
      const usage: UsageRecord = {
        stage,
        model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: Date.now() - started,
        cost_usd: estimateCostUsd(model, tokensIn, tokensOut),
        ok: true,
        error: null,
      };
      await ctx?.sink?.(usage);
      return { data: parsed.data as z.infer<S>, usage };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      await ctx?.sink?.({
        stage,
        model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: Date.now() - started,
        cost_usd: estimateCostUsd(model, tokensIn, tokensOut),
        ok: false,
        error: lastError.slice(0, 300),
      });
      if (err instanceof M3Error) throw err;
      // Lỗi hạ tầng (mạng, 4xx/5xx) không thử lại ở tầng này vì SDK đã tự retry
      if (/schema validation|valid JSON|refusal/.test(lastError) === false) {
        throw new M3Error("LLM_FAILED", `Lỗi gọi AI (${stage}): ${lastError.slice(0, 160)}`);
      }
    }
  }
  throw new M3Error("LLM_INVALID_OUTPUT", `AI trả về dữ liệu không hợp lệ (${stage}): ${lastError.slice(0, 160)}`);
}
