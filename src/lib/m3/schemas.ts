/**
 * Module 3 v2 — JSON schema (zod) cho mọi đầu ra của AI.
 * Quy ước để dùng được với OpenAI structured outputs (strict):
 *  - Mọi trường đều bắt buộc; dữ liệu chưa có dùng `null` (không dùng optional).
 *  - Không dùng ràng buộc số/độ dài trong schema; giá trị được chuẩn hóa (clamp) sau khi parse.
 */
import { z } from "zod";

const str = z.string();
const strN = z.string().nullable();
const num = z.number();
const numN = z.number().nullable();
const bool = z.boolean();

/* ───────────────────────────── CV ───────────────────────────── */

export const ParsedCvSchema = z.object({
  language: str.describe("vi hoặc en — ngôn ngữ chính của CV"),
  basics: z.object({
    full_name: strN,
    headline: strN,
    location: strN,
    years_experience_total: numN,
    summary: strN,
  }),
  education: z.array(
    z.object({
      institution: str,
      degree: strN,
      field: strN,
      period: strN,
      source_quote: strN,
    }),
  ),
  experience: z.array(
    z.object({
      id: str.describe("exp1, exp2, ..."),
      company: str,
      title: strN,
      period_raw: strN,
      start: strN.describe("YYYY-MM hoặc null"),
      end: strN.describe("YYYY-MM, 'present' hoặc null"),
      duration_months: numN,
      responsibilities: z.array(str),
      achievements: z.array(
        z.object({
          text: str,
          metric: strN.describe("số liệu nếu CV ghi rõ, ngược lại null"),
          is_quantified: bool,
          source_quote: strN,
        }),
      ),
      personal_role_clarity: z.enum(["clear", "vague", "unknown"]),
      source_quote: strN,
    }),
  ),
  skills: z.array(
    z.object({
      name: str,
      category: z.enum(["technical", "soft", "tool", "language", "domain"]),
      evidence: z.enum(["explicit", "inferred"]),
      source_quote: strN,
    }),
  ),
  projects: z.array(
    z.object({
      name: str,
      description: strN,
      role: strN,
      technologies: z.array(str),
      outcome: strN,
      source_quote: strN,
    }),
  ),
  certifications: z.array(
    z.object({ name: str, issuer: strN, year: strN, source_quote: strN }),
  ),
  data_quality: z.object({
    missing_sections: z.array(str),
    notes: z.array(str),
    timeline_gaps: z.array(
      z.object({ from: str, to: str, months: num, note: str }),
    ),
    inferred_items: z.array(str).describe("các nhận định do AI suy luận, KHÔNG ghi rõ trong CV"),
  }),
});
export type ParsedCv = z.infer<typeof ParsedCvSchema>;

/* ───────────────────────────── JD ───────────────────────────── */

const Requirement = z.object({
  id: str,
  text: str,
  category: z.enum(["experience", "skill", "education", "language", "other"]),
});

export const ParsedJdSchema = z.object({
  language: str,
  title: str,
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead", "manager", "director", "unknown"]),
  domain: strN,
  responsibilities: z.array(z.object({ id: str, text: str })),
  must_have: z.array(Requirement),
  nice_to_have: z.array(Requirement),
  years_experience_min: numN,
  technical_skills: z.array(str),
  management_skills: z.array(str),
  kpis: z.array(str),
  core_competencies: z.array(
    z.object({
      id: str,
      name: str,
      description: str,
      weight_hint: num.describe("1–5, mức quan trọng theo JD"),
      source_quote: strN,
    }),
  ),
  missing_info: z.array(str).describe("JD thiếu thông tin gì"),
});
export type ParsedJd = z.infer<typeof ParsedJdSchema>;

/* ─────────────────────── Đối chiếu CV–JD ─────────────────────── */

export const MatchSchema = z.object({
  overall_fit: num.describe("0–100, ước lượng độ phù hợp"),
  summary: str,
  strengths: z.array(
    z.object({
      jd_ref: str,
      cv_ref: str,
      explanation: str,
      jd_quote: strN,
      cv_quote: strN,
    }),
  ),
  gaps: z.array(
    z.object({
      jd_ref: str,
      type: z.enum(["experience", "skill", "achievement"]),
      explanation: str,
      severity: z.enum(["high", "medium", "low"]),
      jd_quote: strN,
    }),
  ),
  to_verify: z.array(
    z.object({
      type: z.enum(["timeline", "missing_metric", "unclear_role", "inconsistency", "vague_claim"]),
      cv_ref: str,
      detail: str,
      suggested_probe: str,
      cv_quote: strN,
    }),
  ),
});
export type MatchResult = z.infer<typeof MatchSchema>;

/* ───────────────────────────── Kế hoạch ───────────────────────────── */

export const STAGE_KEYS = [
  "warmup",
  "cv_verify",
  "deep_dive",
  "jd_competency",
  "problem_solving",
  "situational",
  "behavioral_star",
  "gap_probe",
  "candidate_questions",
  "closing",
] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

export const PlanSchema = z.object({
  summary: str,
  competencies: z.array(
    z.object({
      id: str.describe("c1, c2, ..."),
      name: str,
      description: str,
      weight: num.describe("trọng số tương đối; sẽ được chuẩn hóa tổng = 1"),
      source: z.enum(["jd", "cv_gap", "cv_verify", "general"]),
      jd_refs: z.array(str),
      target_evidence: num.describe("số bằng chứng cần thu thập (1–3)"),
      assessment_type: z.enum(["behavioral", "technical", "situational", "verification"]),
    }),
  ),
  stages: z.array(
    z.object({
      id: str,
      key: z.enum(STAGE_KEYS),
      name: str,
      objective: str,
      competencies: z.array(str).describe("id năng lực được kiểm tra trong chặng này"),
      planned_turns: num,
      evidence_needed: z.array(str),
      exit_condition: str,
      seed_questions: z.array(
        z.object({ text: str, competency: str, source_ref: strN }),
      ),
    }),
  ),
});
export type InterviewPlan = z.infer<typeof PlanSchema>;

/* ───────────────────────────── Điều phối từng lượt ───────────────────────────── */

export const ORCHESTRATOR_ACTIONS = [
  "follow_up",
  "probe_gap",
  "challenge_cv",
  "next_topic",
  "clarify",
  "wrap_up",
] as const;
export type OrchestratorAction = (typeof ORCHESTRATOR_ACTIONS)[number];

export const OrchestratorSchema = z.object({
  action: z.enum(ORCHESTRATOR_ACTIONS),
  competency: str.describe("id năng lực mà câu hỏi tiếp theo nhắm tới"),
  stage_key: z.enum(STAGE_KEYS),
  reason: str,
  answer_assessment: z.object({
    quality: z.enum(["strong", "adequate", "vague", "off_topic", "insufficient"]),
    has_personal_role: bool,
    has_metrics: bool,
    has_result: bool,
  }),
  evidence: z.array(
    z.object({
      competency: str,
      quote: str.describe("trích NGUYÊN VĂN từ câu trả lời của ứng viên"),
      signal: z.enum(["positive", "negative", "neutral"]),
      strength: num.describe("1–5"),
      star_s: bool,
      star_t: bool,
      star_a: bool,
      star_r: bool,
    }),
  ),
  missing_evidence: z.array(str),
  cv_conflict: z
    .object({ cv_ref: str, cv_text: str, said_text: str })
    .nullable(),
  question: str.describe("câu hỏi tiếp theo (đúng 1 câu hỏi chính)"),
  next_focus: str,
});
export type OrchestratorDecision = z.infer<typeof OrchestratorSchema>;

/* ───────────────────────────── Đánh giá cuối ───────────────────────────── */

export const EvaluationSchema = z.object({
  competency_scores: z.array(
    z.object({
      competency_id: str,
      score: num.describe("số nguyên 1–5"),
      rationale: str,
      evidence: z.array(z.object({ quote: str, turn_index: num })),
      confidence: z.enum(["high", "medium", "low"]),
      insufficient_data: bool,
    }),
  ),
  star_analysis: z.array(
    z.object({
      turn_index: num,
      question_summary: str,
      situation: bool,
      task: bool,
      action: bool,
      result: bool,
      missing: z.array(str),
      comment: str,
    }),
  ),
  cv_consistency: z.array(
    z.object({
      cv_ref: str,
      cv_claim: str,
      candidate_statement: strN,
      quote: strN,
      status: z.enum(["consistent", "inconsistent", "unverified", "not_discussed"]),
      note: str,
    }),
  ),
  strengths: z.array(z.object({ text: str, quote: strN })),
  weaknesses: z.array(z.object({ text: str, quote: strN })),
  to_verify: z.array(str),
  highlights: z.array(z.object({ quote: str, turn_index: num, why: str })),
  top_priorities: z.array(z.object({ title: str, detail: str })),
  better_answers: z.array(
    z.object({ turn_index: num, question: str, suggestion: str }),
  ),
  summary: str,
  recommendation_rationale: str,
});
export type EvaluationRaw = z.infer<typeof EvaluationSchema>;

export const RECOMMENDATIONS = ["highly_recommended", "recommended", "consider", "not_recommended"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

/* ───────────────────────────── Trạng thái buổi phỏng vấn ───────────────────────────── */

export type InterviewConfig = {
  interview_type: "hr_screening" | "hiring_manager" | "technical" | "behavioral";
  strictness: "friendly" | "neutral" | "strict";
  duration_min: number;
  language: "vi" | "en";
  voice: string;
  candidate_name: string | null;
};

export type AskedQuestion = {
  turn: number;
  question: string;
  competency: string;
  stage_key: StageKey;
  action: OrchestratorAction | "open";
};

export type InterviewState = {
  turn_count: number; // số câu hỏi đã được đặt (kể cả mở đầu)
  turn_budget: number;
  stage_index: number;
  stage_turns: Record<string, number>;
  asked: AskedQuestion[];
  coverage: Record<string, { count: number; avg_strength: number; negatives: number }>;
  to_verify: string[];
  follow_up_streak: number;
  clarify_streak: number;
  done: boolean;
  closing_phase: "none" | "candidate_questions" | "closed";
};
