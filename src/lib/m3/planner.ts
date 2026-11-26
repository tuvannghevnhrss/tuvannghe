/** Interview Planner — tạo kế hoạch phỏng vấn trước khi bắt đầu (chạy 1 lần). */
import {
  M3_MODELS,
  turnBudgetForDuration,
  type InterviewType,
  type Strictness,
} from "./config";
import { callStructured, type LlmContext } from "./llm";
import {
  PlanSchema,
  STAGE_KEYS,
  type InterviewConfig,
  type InterviewPlan,
  type MatchResult,
  type ParsedCv,
  type ParsedJd,
} from "./schemas";
import { allocateStageTurns, normalizeWeights } from "./scoring";
import { DATA_SAFETY_NOTICE, wrapData } from "./security";
import { clamp, truncate } from "./text";

const TYPE_GUIDE: Record<InterviewType, string> = {
  hr_screening:
    "HR screening: motivation, culture fit, salary/availability basics, CV verification, communication. Light technical depth.",
  hiring_manager:
    "Hiring manager round: ownership, results, decision-making, stakeholder management, how the candidate would handle the JD's responsibilities in the first 90 days.",
  technical:
    "Technical interview: depth in the JD's technical skills, problem solving, trade-offs, debugging/real cases, scenario reasoning. Fewer purely behavioural questions.",
  behavioral:
    "Behavioural interview: STAR-based questions on teamwork, conflict, failure, leadership, adaptability, mapped to the JD competencies.",
};

const STRICTNESS_GUIDE: Record<Strictness, string> = {
  friendly: "friendly: encourage, fewer challenges, still collect evidence.",
  neutral: "neutral: balanced; probe vague answers once or twice.",
  strict: "strict: probe every vague claim, request numbers and personal contribution, challenge inconsistencies.",
};

export function planSummaryForPrompt(plan: InterviewPlan): string {
  return plan.stages
    .map(
      (s, i) =>
        `${i + 1}. [${s.key}] ${s.name} (${s.planned_turns} turns) — ${s.objective}; competencies: ${s.competencies.join(", ") || "-"}`,
    )
    .join("\n");
}

/** Bảo đảm kế hoạch hợp lệ: id năng lực tồn tại, trọng số = 1, tổng lượt = ngân sách, có chặng bắt buộc. */
export function normalizePlan(raw: InterviewPlan, budget: number): InterviewPlan {
  const competencies = normalizeWeights(
    raw.competencies.map((c, i) => ({
      ...c,
      id: c.id || `c${i + 1}`,
      target_evidence: Math.round(clamp(c.target_evidence, 1, 3)),
    })),
  );
  const ids = new Set(competencies.map((c) => c.id));

  let stages = raw.stages
    .filter((s) => (STAGE_KEYS as readonly string[]).includes(s.key))
    .map((s, i) => ({
      ...s,
      id: s.id || `s${i + 1}`,
      competencies: s.competencies.filter((id) => ids.has(id)),
      seed_questions: s.seed_questions.filter((q) => q.text.trim().length > 8 && (ids.has(q.competency) || !q.competency)),
    }));

  // Mỗi buổi phải có warmup ở đầu, candidate_questions + closing ở cuối
  const hasKey = (k: string) => stages.some((s) => s.key === k);
  const mk = (key: (typeof STAGE_KEYS)[number], name: string, objective: string) => ({
    id: `auto_${key}`,
    key,
    name,
    objective,
    competencies: [] as string[],
    planned_turns: 1,
    evidence_needed: [] as string[],
    exit_condition: "Đã hoàn thành chặng.",
    seed_questions: [] as { text: string; competency: string; source_ref: string | null }[],
  });
  if (!hasKey("warmup")) stages = [mk("warmup", "Khởi động", "Làm quen, ứng viên tự giới thiệu."), ...stages];
  if (!hasKey("candidate_questions")) stages = [...stages, mk("candidate_questions", "Ứng viên đặt câu hỏi", "Ứng viên hỏi lại nhà tuyển dụng.")];
  if (!hasKey("closing")) stages = [...stages, mk("closing", "Kết thúc", "Cảm ơn và thông báo bước tiếp theo.")];

  // closing luôn là chặng cuối, candidate_questions ngay trước nó
  const order = (k: string) => (k === "closing" ? 2 : k === "candidate_questions" ? 1 : 0);
  stages = [...stages].sort((a, b) => order(a.key) - order(b.key));

  const turns = allocateStageTurns(stages, budget);
  stages = stages.map((s, i) => ({ ...s, planned_turns: turns[i] }));
  return { ...raw, competencies, stages };
}

export async function createInterviewPlan(
  input: {
    cv: ParsedCv;
    jd: ParsedJd;
    match: MatchResult;
    config: InterviewConfig;
  },
  ctx?: LlmContext,
): Promise<InterviewPlan> {
  const { cv, jd, match, config } = input;
  const budget = turnBudgetForDuration(config.duration_min);
  const lang = config.language === "vi" ? "Vietnamese" : "English";

  const system = `You are the Interview Planner of an AI interview system. Design a realistic interview plan for ONE candidate and ONE job.
${DATA_SAFETY_NOTICE}

Interview type: ${TYPE_GUIDE[config.interview_type]}
Strictness: ${STRICTNESS_GUIDE[config.strictness]}
Total main-question budget: about ${budget} questions (including the opener and the candidate-questions turn). Do not plan more.
Interview language: ${lang}. All names, objectives and seed question texts must be written in ${lang}.

Requirements:
1. competencies (5–8): derive from the JD core competencies and must-haves, PLUS the CV gaps / items to verify from the match analysis. Give weights by importance to the job (JD-driven). Each has an id c1, c2, ...
2. stages: choose from these keys, in a sensible order: ${STAGE_KEYS.join(", ")}.
   Typical order: warmup → cv_verify → deep_dive → jd_competency → problem_solving/situational → behavioral_star → gap_probe → candidate_questions → closing. Skip stages that do not fit the interview type.
3. Every stage needs: objective, competencies tested (ids), planned_turns, evidence_needed, exit_condition (when to move on), and 1–3 seed_questions that are SPECIFIC to this candidate and job (cite the CV item or JD requirement in source_ref, e.g. "exp2", "m3", "gap:m5").
4. seed_questions must be answerable aloud in about 1–2 minutes, one question each, never generic ("tell me about your strengths") unless it is the warmup.
5. Never invent facts about the candidate. Reference only things present in the CV/JD/match data.
6. The closing stage has 0 planned turns; candidate_questions has 1.`;

  const user = `Create the plan.\n\n${wrapData(
    "session_data",
    truncate(
      JSON.stringify({
        candidate_name: config.candidate_name,
        cv: {
          basics: cv.basics,
          experience: cv.experience.map((e) => ({
            id: e.id,
            company: e.company,
            title: e.title,
            period: e.period_raw,
            responsibilities: e.responsibilities.slice(0, 5),
            achievements: e.achievements.slice(0, 5),
            personal_role_clarity: e.personal_role_clarity,
          })),
          skills: cv.skills.slice(0, 30).map((s) => s.name),
          projects: cv.projects.slice(0, 6),
          timeline_gaps: cv.data_quality.timeline_gaps,
        },
        jd,
        match,
      }),
      30_000,
    ),
  )}`;

  const { data } = await callStructured({
    stage: "plan",
    model: M3_MODELS.plan,
    schemaName: "interview_plan",
    schema: PlanSchema,
    system,
    user,
    temperature: 0.4,
    maxTokens: 6000,
    ctx,
  });
  return normalizePlan(data, budget);
}
