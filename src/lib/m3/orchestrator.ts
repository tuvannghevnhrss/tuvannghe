/**
 * Interview Orchestrator + Evidence Tracker.
 * Sau mỗi câu trả lời: phân tích → thu bằng chứng → quyết định hành động → sinh câu hỏi kế tiếp.
 * Mọi nguồn phỏng vấn (Realtime, pipeline dự phòng) đều đi qua đây.
 */
import { M3_LIMITS, M3_MODELS, turnBudgetForDuration } from "./config";
import { callStructured, type LlmContext } from "./llm";
import {
  buildClosing,
  buildOpener,
  candidateQuestionsPrompt,
  clarifyRepeat,
  clarifyShort,
  isRepeatRequest,
} from "./persona";
import {
  OrchestratorSchema,
  type AskedQuestion,
  type InterviewConfig,
  type InterviewPlan,
  type InterviewState,
  type MatchResult,
  type OrchestratorAction,
  type OrchestratorDecision,
  type ParsedCv,
  type ParsedJd,
  type StageKey,
} from "./schemas";
import { DATA_SAFETY_NOTICE, wrapData } from "./security";
import { clamp, countWords, findSimilarQuestion, jaccard, quoteAppearsIn, truncate } from "./text";

export type TurnRecord = { turn: number; question: string; answer: string };

export type EvidenceItem = {
  competency: string;
  quote: string;
  signal: "positive" | "negative" | "neutral";
  strength: number;
  star: { s: boolean; t: boolean; a: boolean; r: boolean };
};

const SPECIAL_STAGES: StageKey[] = ["candidate_questions", "closing"];
const FOLLOW_UP_CAP = { friendly: 1, neutral: 2, strict: 3 } as const;

/* ───────────────────────── trạng thái ───────────────────────── */

export function initialState(config: InterviewConfig): InterviewState {
  return {
    turn_count: 0,
    turn_budget: turnBudgetForDuration(config.duration_min),
    stage_index: 0,
    stage_turns: {},
    asked: [],
    coverage: {},
    to_verify: [],
    follow_up_streak: 0,
    clarify_streak: 0,
    done: false,
    closing_phase: "none",
  };
}

export function openInterview(
  plan: InterviewPlan,
  config: InterviewConfig,
  jobTitle: string,
  base?: InterviewState,
): { question: string; state: InterviewState } {
  const state = base ?? initialState(config);
  const first = plan.stages[0];
  const question = buildOpener(config, jobTitle);
  const asked: AskedQuestion = {
    turn: 1,
    question,
    competency: first?.competencies[0] ?? "",
    stage_key: first?.key ?? "warmup",
    action: "open",
  };
  return {
    question,
    state: {
      ...state,
      turn_count: 1,
      stage_index: 0,
      stage_turns: { ...state.stage_turns, [first?.id ?? "s1"]: 1 },
      asked: [asked],
    },
  };
}

export function applyEvidence(state: InterviewState, items: EvidenceItem[]): InterviewState {
  const coverage = { ...state.coverage };
  for (const ev of items) {
    const cur = coverage[ev.competency] ?? { count: 0, avg_strength: 0, negatives: 0 };
    const count = cur.count + 1;
    coverage[ev.competency] = {
      count,
      avg_strength: Math.round(((cur.avg_strength * cur.count + ev.strength) / count) * 100) / 100,
      negatives: cur.negatives + (ev.signal === "negative" ? 1 : 0),
    };
  }
  return { ...state, coverage };
}

export function coverageSummary(plan: InterviewPlan, state: InterviewState) {
  return plan.competencies.map((c) => {
    const cov = state.coverage[c.id] ?? { count: 0, avg_strength: 0, negatives: 0 };
    return {
      id: c.id,
      name: c.name,
      weight: Math.round(c.weight * 100) / 100,
      target: c.target_evidence,
      collected: cov.count,
      avg_strength: cov.avg_strength,
      enough: cov.count >= c.target_evidence,
    };
  });
}

export function progressOf(plan: InterviewPlan, state: InterviewState) {
  const stage = plan.stages[Math.min(state.stage_index, plan.stages.length - 1)];
  const phaseName =
    state.closing_phase === "candidate_questions"
      ? "Ứng viên đặt câu hỏi"
      : state.closing_phase === "closed"
        ? "Kết thúc"
        : stage?.name ?? "";
  return {
    turn: Math.min(state.turn_count, state.turn_budget),
    budget: state.turn_budget,
    percent: Math.min(100, Math.round((state.turn_count / Math.max(1, state.turn_budget)) * 100)),
    stage: phaseName,
    done: state.done,
  };
}

/* ───────────────────────── tiện ích chọn chặng ───────────────────────── */

function nextRegularStageIndex(plan: InterviewPlan, from: number): number | null {
  for (let i = from + 1; i < plan.stages.length; i += 1) {
    if (!SPECIAL_STAGES.includes(plan.stages[i].key)) return i;
  }
  return null;
}

function unaskedSeeds(plan: InterviewPlan, state: InterviewState, stageIdx: number) {
  const asked = state.asked.map((a) => a.question);
  const out: { text: string; competency: string; stage: string }[] = [];
  for (let i = stageIdx; i < Math.min(plan.stages.length, stageIdx + 2); i += 1) {
    for (const q of plan.stages[i].seed_questions) {
      if (!findSimilarQuestion(q.text, asked, 0.5)) out.push({ text: q.text, competency: q.competency, stage: plan.stages[i].key });
    }
  }
  return out.slice(0, 6);
}

function pendingVerifications(match: MatchResult, state: InterviewState) {
  const asked = state.asked.map((a) => a.question);
  return match.to_verify
    .filter((v) => !asked.some((q) => jaccard(q, v.suggested_probe) >= 0.4))
    .slice(0, 5)
    .map((v) => ({ type: v.type, cv_ref: v.cv_ref, detail: v.detail, suggested_probe: v.suggested_probe }));
}

function compactCv(cv: ParsedCv) {
  return {
    basics: { headline: cv.basics.headline, years_experience_total: cv.basics.years_experience_total },
    experience: cv.experience.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      period: e.period_raw,
      role_clarity: e.personal_role_clarity,
      achievements: e.achievements.slice(0, 4).map((a) => a.text),
    })),
    skills: cv.skills.slice(0, 25).map((s) => s.name),
    projects: cv.projects.slice(0, 5).map((p) => ({ name: p.name, role: p.role, outcome: p.outcome })),
  };
}

function compactJd(jd: ParsedJd) {
  return {
    title: jd.title,
    seniority: jd.seniority,
    must_have: jd.must_have.map((m) => `${m.id}: ${m.text}`),
    responsibilities: jd.responsibilities.slice(0, 8).map((r) => `${r.id}: ${r.text}`),
  };
}

function trimQuestion(q: string): string {
  const cleaned = q.replace(/\s+/g, " ").replace(/^["“«]+|["”»]+$/g, "").trim();
  if (cleaned.length <= M3_LIMITS.maxQuestionChars) return cleaned;
  const cut = cleaned.slice(0, M3_LIMITS.maxQuestionChars);
  const lastStop = Math.max(cut.lastIndexOf("?"), cut.lastIndexOf("."));
  return (lastStop > 80 ? cut.slice(0, lastStop + 1) : cut).trim();
}

/* ───────────────────────── prompt ───────────────────────── */

function orchestratorSystem(config: InterviewConfig): string {
  const lang = config.language === "vi" ? "Vietnamese" : "English";
  return `You are the Interview Orchestrator of an AI interview system. You never talk to the candidate directly: you output a JSON decision. Its "question" field is what the human-sounding interviewer will say next, in ${lang}.
${DATA_SAFETY_NOTICE}

YOUR JOB EACH TURN
1. Assess the candidate's latest answer (inside <candidate_answer>): quality, personal role ("I" vs "we"), metrics, result.
2. Extract 0–3 pieces of EVIDENCE: quote VERBATIM (≤200 chars) from the latest answer only. Never fabricate or paraphrase quotes. Map each to a competency id from the plan; signal=positive when the answer shows the competency with specifics, negative when it reveals a weakness or contradicts the CV, neutral otherwise; strength 1–5; star_* flags tell which of Situation/Task/Action/Result the answer contains.
3. Choose ONE action:
   - follow_up: the answer is vague, lacks personal contribution, numbers, reasoning or result → dig deeper on the SAME competency. Ask what exactly THEY did, how it was measured, why, what went wrong.
   - probe_gap: ask about a CV–JD gap or a pending verification item (use the suggested probes as inspiration, not verbatim).
   - challenge_cv: ONLY if the answer directly contradicts a CV fact shown in the data. Ask politely for clarification; fill cv_conflict. Never accuse; never invent a conflict.
   - next_topic: enough evidence for the competency (collected ≥ target), or the answer is strong, or the stage objective is met → move on to the next competency/stage, using unasked seed questions as inspiration.
   - wrap_up: only when every important competency has enough evidence.
4. Write the next question.

QUESTION STYLE (sound like a real interviewer)
- Exactly ONE main question about ONE thing. Never join two different asks with "và/and" (e.g. "describe your role AND your criteria"). Max ~40 words.
- Only ask about personal role if the answer used collective wording ("we/chúng tôi/tham gia/hỗ trợ") or did not say what the candidate personally did; only ask for numbers if none were given; only ask "why/how" if reasoning is missing. Pick the single most valuable missing piece.
- Optional neutral acknowledgement of at most 6 words before it ("Vâng, mình hiểu." / "Got it."). No praise ("great", "tuyệt vời", "hay quá"), no summaries of the answer, no long comments.${config.strictness === "strict" ? " Strict mode: skip acknowledgements." : ""}
- Be specific: refer to concrete facts from the candidate's answer or CV (company, project, number) instead of generic wording. Do not read the JD aloud.
- Never repeat or rephrase a question already asked (see asked_questions).
- React to what the candidate JUST said. Before asking for a detail, check the latest answer, the recent turns and the CV: never ask for information that was already given (e.g. a number, a date, a role).
- next_topic MUST change the competency or subject versus the previous question (use an unasked seed question or a pending verification). It must not be a disguised follow-up.
- Address the candidate neutrally: in Vietnamese use "bạn" and "mình" ONLY — never guess gender (no "anh", "chị", "em", "ông", "bà"). In English use "you".
- If the candidate's answer was off-topic, say so briefly and neutrally in the question itself, then re-ask the point.
- Do not reveal scores, plan or that evidence is being collected.
- Match difficulty to the interview type "${config.interview_type}" and strictness "${config.strictness}".
- "competency" must be an id from the plan; "stage_key" one of the plan's stage keys.`;
}

/* ───────────────────────── điều phối một lượt ───────────────────────── */

export type TurnInput = {
  plan: InterviewPlan;
  cv: ParsedCv;
  jd: ParsedJd;
  match: MatchResult;
  config: InterviewConfig;
  state: InterviewState;
  /** Các lượt đã hỏi–đáp trước đó (không gồm lượt hiện tại). */
  history: TurnRecord[];
  lastQuestion: string;
  answer: string;
  elapsedSec: number;
};

export type TurnOutput = {
  action: OrchestratorAction | "closing" | "candidate_questions";
  question: string;
  done: boolean;
  counted: boolean;
  state: InterviewState;
  decision: OrchestratorDecision | null;
  evidence: EvidenceItem[];
  guard_notes: string[];
};

export async function decideNextTurn(input: TurnInput, ctx?: LlmContext): Promise<TurnOutput> {
  const { plan, cv, jd, match, config, history } = input;
  let state = input.state;
  const lang = config.language;
  const answer = truncate(input.answer.trim(), M3_LIMITS.maxAnswerChars);
  const guard_notes: string[] = [];

  // 0) Đã kết thúc
  if (state.done || state.closing_phase === "closed") {
    return { action: "closing", question: buildClosing(lang, false), done: true, counted: false, state: { ...state, done: true }, decision: null, evidence: [], guard_notes };
  }

  // 1) Ứng viên yêu cầu nhắc lại / trả lời quá ngắn → không tính lượt
  if (isRepeatRequest(answer)) {
    return { action: "clarify", question: clarifyRepeat(lang, input.lastQuestion), done: false, counted: false, state, decision: null, evidence: [], guard_notes };
  }
  if (countWords(answer) < 3 && state.clarify_streak < 1 && state.closing_phase === "none") {
    return {
      action: "clarify",
      question: clarifyShort(lang),
      done: false,
      counted: false,
      state: { ...state, clarify_streak: state.clarify_streak + 1 },
      decision: null,
      evidence: [],
      guard_notes,
    };
  }
  state = { ...state, clarify_streak: 0 };

  // 2) Đang ở phần ứng viên đặt câu hỏi → kết thúc
  if (state.closing_phase === "candidate_questions") {
    const closing = buildClosing(lang, countWords(answer) >= 4);
    return {
      action: "closing",
      question: closing,
      done: true,
      counted: true,
      state: { ...state, closing_phase: "closed", done: true },
      decision: null,
      evidence: [],
      guard_notes,
    };
  }

  // 3) Gọi bộ điều phối (thu bằng chứng + quyết định)
  const elapsedLimit = config.duration_min * 60 * 1.05;
  const mustWrap = state.turn_count >= state.turn_budget - 1 || input.elapsedSec > elapsedLimit;
  const stageIdx = Math.min(state.stage_index, plan.stages.length - 1);
  const stage = plan.stages[stageIdx];
  const stageUsed = state.stage_turns[stage?.id ?? ""] ?? 0;
  const stageExhausted = !!stage && stageUsed >= stage.planned_turns + 1;
  const cap = FOLLOW_UP_CAP[config.strictness];
  const streakReached = state.follow_up_streak >= cap;

  const baseContext = {
    plan: {
      competencies: plan.competencies.map((c) => ({ id: c.id, name: c.name, description: c.description, type: c.assessment_type })),
      stages: plan.stages.map((s) => ({ key: s.key, name: s.name, objective: s.objective, competencies: s.competencies, planned_turns: s.planned_turns })),
      current_stage: stage ? { key: stage.key, objective: stage.objective, exit_condition: stage.exit_condition, turns_used: stageUsed, planned_turns: stage.planned_turns } : null,
    },
    coverage: coverageSummary(plan, state),
    cv: compactCv(cv),
    jd: compactJd(jd),
    pending_verifications: pendingVerifications(match, state),
    unasked_seed_questions: unaskedSeeds(plan, state, stageIdx),
    asked_questions: state.asked.map((a) => ({ turn: a.turn, q: truncate(a.question, 160), competency: a.competency, action: a.action })),
    recent_turns: history.slice(-4).map((h) => ({ turn: h.turn, q: truncate(h.question, 200), a: truncate(h.answer, 500) })),
    earlier_turns_summary: history.slice(0, -4).map((h) => ({ turn: h.turn, a: truncate(h.answer, 140) })),
    progress: { questions_asked: state.turn_count, budget: state.turn_budget, elapsed_sec: Math.round(input.elapsedSec) },
  };

  const constraintLines: string[] = [];
  if (mustWrap) constraintLines.push("The interview is at its end: extract evidence from the latest answer; the system will handle the closing. Set action=wrap_up.");
  if (streakReached) constraintLines.push(`You have already asked ${state.follow_up_streak} consecutive follow-ups: action MUST be next_topic (or challenge_cv if a real conflict exists).`);
  if (stageExhausted && !mustWrap) constraintLines.push("The current stage has used its planned turns: action MUST be next_topic.");

  const lastQuestionAsked = input.lastQuestion;
  const askedTexts = state.asked.map((a) => a.question);
  let decision: OrchestratorDecision | null = null;
  const extraNotes: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const userPayload = `${wrapData("session_data", JSON.stringify(baseContext))}

Question the interviewer just asked:
${wrapData("session_data", truncate(lastQuestionAsked, 500))}

Candidate's latest answer:
${wrapData("candidate_answer", answer)}

Constraints for this turn:
${[...constraintLines, ...extraNotes].map((l) => `- ${l}`).join("\n") || "- none"}`;

    const { data } = await callStructured({
      stage: "orchestrate",
      model: M3_MODELS.orchestrator,
      schemaName: "orchestrator_decision",
      schema: OrchestratorSchema,
      system: orchestratorSystem(config),
      user: userPayload,
      temperature: 0.5,
      maxTokens: 1400,
      ctx,
    });
    decision = data;

    // Kiểm tra vi phạm để thử lại một lần
    const violations: string[] = [];
    const act = data.action === "clarify" ? "follow_up" : data.action;
    if (!mustWrap && act !== "wrap_up") {
      if ((streakReached || stageExhausted) && (act === "follow_up" || act === "probe_gap")) {
        violations.push("Your action violates the constraints; choose next_topic and a new question.");
      }
      const similar = findSimilarQuestion(trimQuestion(data.question), askedTexts);
      if (similar) violations.push(`The question is too similar to an earlier one ("${truncate(askedTexts[similar.index], 120)}"). Ask about something different.`);
      if (!data.question.trim()) violations.push("The question is empty.");
    }
    if (!violations.length) break;
    guard_notes.push(...violations.map((v) => `attempt${attempt + 1}: ${v}`));
    extraNotes.splice(0, extraNotes.length, ...violations);
  }
  if (!decision) throw new Error("Orchestrator returned no decision");

  // 4) Kiểm tra bằng chứng: trích dẫn phải có thật trong câu trả lời, năng lực phải thuộc kế hoạch
  const compIds = new Set(plan.competencies.map((c) => c.id));
  const evidence: EvidenceItem[] = decision.evidence
    .filter((e) => compIds.has(e.competency) && quoteAppearsIn(e.quote, answer))
    .slice(0, 3)
    .map((e) => ({
      competency: e.competency,
      quote: truncate(e.quote, 220),
      signal: e.signal,
      strength: Math.round(clamp(e.strength, 1, 5)),
      star: { s: e.star_s, t: e.star_t, a: e.star_a, r: e.star_r },
    }));
  const droppedEvidence = decision.evidence.length - evidence.length;
  if (droppedEvidence > 0) guard_notes.push(`dropped ${droppedEvidence} unverifiable evidence item(s)`);
  state = applyEvidence(state, evidence);

  // 5) Chuyển sang phần cuối nếu hết ngân sách / hết giờ / model báo đủ bằng chứng
  const allEnough = coverageSummary(plan, state).filter((c) => c.weight >= 0.12).every((c) => c.enough);
  const wrap = mustWrap || (decision.action === "wrap_up" && (allEnough || state.turn_count >= state.turn_budget * 0.8));
  if (wrap) {
    const question = candidateQuestionsPrompt(lang, config.strictness);
    const asked: AskedQuestion = { turn: state.turn_count + 1, question, competency: "", stage_key: "candidate_questions", action: "wrap_up" };
    return {
      action: "candidate_questions",
      question,
      done: false,
      counted: true,
      state: { ...state, turn_count: state.turn_count + 1, closing_phase: "candidate_questions", follow_up_streak: 0, asked: [...state.asked, asked] },
      decision,
      evidence,
      guard_notes,
    };
  }

  // 6) Xác định chặng cho câu hỏi tiếp theo (code quyết định, không tin hoàn toàn model)
  let action: OrchestratorAction = decision.action === "clarify" || decision.action === "wrap_up" ? "next_topic" : decision.action;
  let nextIdx = stageIdx;
  if (action === "next_topic" || streakReached || stageExhausted) {
    const n = nextRegularStageIndex(plan, stageIdx);
    if (n === null) {
      // Hết chặng thường → chuyển sang ứng viên đặt câu hỏi
      const question = candidateQuestionsPrompt(lang, config.strictness);
      const asked: AskedQuestion = { turn: state.turn_count + 1, question, competency: "", stage_key: "candidate_questions", action: "wrap_up" };
      return {
        action: "candidate_questions",
        question,
        done: false,
        counted: true,
        state: { ...state, turn_count: state.turn_count + 1, closing_phase: "candidate_questions", follow_up_streak: 0, asked: [...state.asked, asked] },
        decision,
        evidence,
        guard_notes,
      };
    }
    nextIdx = n;
    if (action !== "next_topic" && (streakReached || stageExhausted)) action = "next_topic";
  }
  const nextStage = plan.stages[nextIdx];

  // 7) Câu hỏi cuối cùng: chống lặp bằng seed question nếu model vẫn lặp
  let question = trimQuestion(decision.question);
  if (!question || findSimilarQuestion(question, askedTexts)) {
    const seed = unaskedSeeds(plan, state, nextIdx)[0];
    question = seed ? trimQuestion(seed.text) : lang === "vi" ? "Bạn có thể kể thêm về một tình huống khác trong công việc mà bạn tự hào nhất không?" : "Could you tell me about another situation at work you are proud of?";
    guard_notes.push("fallback to seed question after repeated similarity");
  }

  const competency = compIds.has(decision.competency) ? decision.competency : nextStage.competencies[0] ?? plan.competencies[0]?.id ?? "";
  const asked: AskedQuestion = { turn: state.turn_count + 1, question, competency, stage_key: nextStage.key, action };
  const newState: InterviewState = {
    ...state,
    turn_count: state.turn_count + 1,
    stage_index: nextIdx,
    stage_turns: { ...state.stage_turns, [nextStage.id]: (state.stage_turns[nextStage.id] ?? 0) + 1 },
    follow_up_streak: action === "follow_up" || action === "probe_gap" ? state.follow_up_streak + 1 : 0,
    asked: [...state.asked, asked],
  };

  return { action, question, done: false, counted: true, state: newState, decision: { ...decision, question, action, competency, stage_key: nextStage.key }, evidence, guard_notes };
}
