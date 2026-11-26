/** Helper phía máy chủ cho các route /api/interview/m3/*: xác thực, quyền sở hữu, ghi usage, chuẩn hóa lỗi. */
import { z } from "zod";
import { requireInterviewUser } from "@/app/api/interview/_lib/auth";
import { createInterviewSupabaseClient } from "@/app/api/interview/_lib/supabase";
import {
  DURATIONS_MIN,
  INTERVIEW_TYPES,
  M3_LIMITS,
  REALTIME_VOICES,
  STRICTNESS_LEVELS,
} from "./config";
import { M3Error, type LlmContext, type UsageRecord } from "./llm";
import type {
  InterviewConfig,
  InterviewPlan,
  InterviewState,
  MatchResult,
  ParsedCv,
  ParsedJd,
} from "./schemas";

export type Db = ReturnType<typeof createInterviewSupabaseClient>;

export const ConfigInputSchema = z.object({
  interview_type: z.enum(INTERVIEW_TYPES).default("hiring_manager"),
  strictness: z.enum(STRICTNESS_LEVELS).default("neutral"),
  duration_min: z
    .number()
    .refine((n) => (DURATIONS_MIN as readonly number[]).includes(n), "duration_min must be 15, 30, 45 or 60")
    .default(30),
  language: z.enum(["vi", "en"]).default("vi"),
  voice: z.enum(REALTIME_VOICES).default("marin"),
  candidate_name: z.string().trim().max(60).nullable().default(null),
});

export function normalizeConfig(input: unknown): InterviewConfig {
  return ConfigInputSchema.parse(input ?? {}) as InterviewConfig;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof M3Error) {
    const status = err.code === "COST_LIMIT" ? 402 : err.code === "OPENAI_KEY_MISSING" ? 500 : 502;
    return json({ error: err.code, message: err.message }, status);
  }
  if (err instanceof z.ZodError) {
    return json({ error: "INVALID_INPUT", message: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
  }
  if (err instanceof Error && err.message === "AUTH_REQUIRED") {
    return json({ error: "AUTH_REQUIRED", message: "Vui lòng đăng nhập." }, 401);
  }
  if (err instanceof HttpError) return json({ error: err.code, message: err.message }, err.status);
  console.error("[m3] unexpected error:", err instanceof Error ? err.message : err);
  return json({ error: "INTERNAL_ERROR", message: "Đã xảy ra lỗi. Vui lòng thử lại." }, 500);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function authed() {
  const user = await requireInterviewUser();
  return { user, db: createInterviewSupabaseClient() };
}

/** Bản ghi interview đã nạp, kèm các JSON đã parse. */
export type LoadedInterview = {
  row: {
    id: string;
    user_id: string;
    cv_id: string;
    jd_id: string;
    status: string;
    session_id: string | null;
    cost_usd: number;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
  };
  config: InterviewConfig;
  state: InterviewState;
  plan: InterviewPlan | null;
  match: MatchResult | null;
  cv: ParsedCv | null;
  jd: ParsedJd | null;
  jdTitle: string;
};

/** Nạp interview và BẮT BUỘC thuộc về user (không dựa riêng vào RLS vì dùng service role). */
export async function loadInterview(db: Db, userId: string, id: string): Promise<LoadedInterview> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy buổi phỏng vấn.");
  const { data: row, error } = await db.from("m3_interviews").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!row) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy buổi phỏng vấn.");

  const [{ data: cv }, { data: jd }] = await Promise.all([
    db.from("m3_cv_documents").select("parsed").eq("id", row.cv_id).eq("user_id", userId).maybeSingle(),
    db.from("m3_job_descriptions").select("title, parsed").eq("id", row.jd_id).eq("user_id", userId).maybeSingle(),
  ]);
  return {
    row,
    config: row.config as InterviewConfig,
    state: row.state as InterviewState,
    plan: (row.plan as InterviewPlan | null) ?? null,
    match: (row.match as MatchResult | null) ?? null,
    cv: (cv?.parsed as ParsedCv | null) ?? null,
    jd: (jd?.parsed as ParsedJd | null) ?? null,
    jdTitle: (jd?.title as string | undefined) ?? "",
  };
}

/** Ngữ cảnh LLM: ghi usage vào DB và chặn khi vượt trần chi phí của buổi phỏng vấn. */
export function makeLlmContext(db: Db, userId: string, interviewId: string | null, startingCost = 0) {
  let cost = startingCost;
  const ctx: LlmContext = {
    assertBudget: () => {
      if (cost >= M3_LIMITS.maxCostPerInterviewUsd) {
        throw new M3Error("COST_LIMIT", "Buổi phỏng vấn đã đạt giới hạn chi phí AI cho phép.");
      }
    },
    sink: async (r: UsageRecord) => {
      cost += r.cost_usd;
      const { error } = await db.from("m3_ai_usage").insert({
        user_id: userId,
        interview_id: interviewId,
        stage: r.stage,
        model: r.model,
        tokens_in: r.tokens_in,
        tokens_out: r.tokens_out,
        latency_ms: r.latency_ms,
        cost_usd: r.cost_usd,
        ok: r.ok,
        error: r.error,
      });
      if (error) console.error("[m3] usage log failed:", error.message);
    },
  };
  return { ctx, getCost: () => cost };
}

export async function saveCost(db: Db, interviewId: string, cost: number) {
  await db.from("m3_interviews").update({ cost_usd: Math.round(cost * 10000) / 10000 }).eq("id", interviewId);
}

export function expiresAtIso(days = M3_LIMITS.retentionDays) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
