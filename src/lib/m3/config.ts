/**
 * Module 3 v2 — cấu hình tập trung (model, giới hạn, giá ước tính).
 * Mọi model đều có thể ghi đè bằng biến môi trường, KHÔNG hardcode ở nơi khác.
 */

export const M3_MODELS = {
  /** Trích xuất CV / JD → JSON (structured output) */
  extract: process.env.M3_MODEL_EXTRACT || "gpt-4.1-mini",
  /** Đối chiếu CV–JD */
  match: process.env.M3_MODEL_MATCH || "gpt-4.1",
  /** Lập kế hoạch phỏng vấn (chạy 1 lần) */
  plan: process.env.M3_MODEL_PLAN || "gpt-4.1",
  /** Điều phối từng lượt — cần nhanh, độ trễ thấp */
  orchestrator: process.env.M3_MODEL_ORCHESTRATOR || "gpt-4.1-mini",
  /** Đánh giá cuối buổi — phân tích sâu */
  evaluate: process.env.M3_MODEL_EVALUATE || "gpt-4.1",
  /** Giọng nói thời gian thực (GA) */
  realtime: process.env.M3_MODEL_REALTIME || "gpt-realtime",
  /** Chuyển giọng nói → văn bản trong Realtime và pipeline dự phòng */
  transcribe: process.env.M3_MODEL_TRANSCRIBE || "gpt-4o-mini-transcribe",
} as const;

export type M3Stage = "cv_parse" | "jd_parse" | "match" | "plan" | "orchestrate" | "evaluate" | "realtime" | "stt";

/** Giá ước tính USD / 1M token (input, output). Chỉ dùng để theo dõi chi phí, không dùng để thanh toán. */
export const M3_PRICING_PER_MTOK: Record<string, { in: number; out: number }> = {
  "gpt-4.1": { in: 2.0, out: 8.0 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-5-mini": { in: 0.25, out: 2.0 },
  "gpt-5": { in: 1.25, out: 10.0 },
};
export const M3_DEFAULT_PRICE = { in: 2.0, out: 8.0 };

export function estimateCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const p = M3_PRICING_PER_MTOK[model] ?? M3_DEFAULT_PRICE;
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}

export const M3_LIMITS = {
  /** Dung lượng CV tối đa (byte) */
  cvMaxBytes: 5 * 1024 * 1024,
  /** Số ký tự CV gửi cho AI (cắt bớt phần dư) */
  cvMaxChars: 24_000,
  /** Số ký tự tối thiểu để coi CV có nội dung (tránh PDF scan) */
  cvMinChars: 200,
  jdMaxChars: 12_000,
  jdMinChars: 80,
  /** Trần chi phí AI ước tính cho mỗi buổi phỏng vấn (USD) */
  maxCostPerInterviewUsd: Number(process.env.M3_MAX_COST_PER_INTERVIEW_USD || 1.5),
  /** Độ dài tối đa của một câu trả lời được gửi vào bộ điều phối (ký tự) */
  maxAnswerChars: 4_000,
  /** Độ dài tối đa của câu hỏi do AI sinh ra (ký tự) */
  maxQuestionChars: 420,
  /** Số ngày lưu CV/dữ liệu phân tích trước khi hết hạn */
  retentionDays: 30,
} as const;

export const INTERVIEW_TYPES = ["hr_screening", "hiring_manager", "technical", "behavioral"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const STRICTNESS_LEVELS = ["friendly", "neutral", "strict"] as const;
export type Strictness = (typeof STRICTNESS_LEVELS)[number];

export const DURATIONS_MIN = [15, 30, 45, 60] as const;
export type DurationMin = (typeof DURATIONS_MIN)[number];

/** Một lượt hỏi–đáp trung bình ≈ 2,2 phút (câu hỏi + trả lời + chuyển tiếp). */
export const MINUTES_PER_TURN = 2.2;

export function turnBudgetForDuration(minutes: number): number {
  return Math.max(4, Math.round(minutes / MINUTES_PER_TURN));
}

export const REALTIME_VOICES = ["marin", "cedar", "alloy", "shimmer", "verse"] as const;
export type RealtimeVoice = (typeof REALTIME_VOICES)[number];
