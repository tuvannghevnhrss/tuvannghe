/** Chấm điểm & tính toán xác định (không để model tự cộng điểm). */
import type { EvaluationRaw, InterviewPlan, Recommendation } from "./schemas";
import { clamp, quoteAppearsIn } from "./text";

export type PlanCompetency = InterviewPlan["competencies"][number];

/** Chuẩn hóa trọng số về tổng = 1; trọng số không hợp lệ chia đều. */
export function normalizeWeights<T extends { weight: number }>(items: T[]): T[] {
  if (!items.length) return items;
  const cleaned = items.map((i) => ({ ...i, weight: Number.isFinite(i.weight) && i.weight > 0 ? i.weight : 0 }));
  const total = cleaned.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return cleaned.map((i) => ({ ...i, weight: 1 / items.length }));
  return cleaned.map((i) => ({ ...i, weight: i.weight / total }));
}

export type ScoredCompetency = {
  competency_id: string;
  name: string;
  weight: number;
  score: number; // 1–5
  rationale: string;
  evidence: { quote: string; turn_index: number }[];
  confidence: "high" | "medium" | "low";
  insufficient_data: boolean;
};

export type OverallResult = {
  weighted_average: number; // 1–5
  overall_score: number; // 0–100
  fit_label: "very_high" | "high" | "medium" | "low";
};

/** Điểm tổng theo trọng số: (avg − 1) / 4 × 100. */
export function computeOverall(scored: Pick<ScoredCompetency, "weight" | "score">[]): OverallResult {
  const totalW = scored.reduce((s, c) => s + c.weight, 0);
  const avg = totalW > 0 ? scored.reduce((s, c) => s + c.weight * c.score, 0) / totalW : 1;
  const weighted_average = Math.round(avg * 100) / 100;
  const overall_score = Math.round(((weighted_average - 1) / 4) * 100);
  const fit_label = overall_score >= 80 ? "very_high" : overall_score >= 62 ? "high" : overall_score >= 42 ? "medium" : "low";
  return { weighted_average, overall_score, fit_label };
}

/**
 * Đề xuất tuyển dụng — suy ra bằng quy tắc xác định từ điểm, rồi hạ bậc khi thiếu dữ liệu.
 * Model chỉ viết phần giải thích, không tự chọn nhãn.
 */
export function deriveRecommendation(
  overall: OverallResult,
  scored: Pick<ScoredCompetency, "score" | "weight" | "insufficient_data">[],
): { recommendation: Recommendation; downgraded_reason: string | null } {
  let level: Recommendation =
    overall.weighted_average >= 4.2
      ? "highly_recommended"
      : overall.weighted_average >= 3.5
        ? "recommended"
        : overall.weighted_average >= 2.7
          ? "consider"
          : "not_recommended";

  const order: Recommendation[] = ["highly_recommended", "recommended", "consider", "not_recommended"];
  const down = (l: Recommendation) => order[Math.min(order.length - 1, order.indexOf(l) + 1)];
  let reason: string | null = null;

  const insufficientWeight = scored.filter((c) => c.insufficient_data).reduce((s, c) => s + c.weight, 0);
  const totalW = scored.reduce((s, c) => s + c.weight, 0) || 1;
  if (insufficientWeight / totalW >= 0.4 && level !== "not_recommended") {
    level = down(level);
    reason = "Hơn 40% trọng số năng lực chưa đủ bằng chứng nên mức đề xuất bị hạ một bậc.";
  }

  const heavyFail = scored.some((c) => c.weight >= 0.2 && c.score <= 1 && !c.insufficient_data);
  if (heavyFail && (level === "highly_recommended" || level === "recommended")) {
    level = "consider";
    reason = "Một năng lực trọng yếu (trọng số ≥ 20%) không đáp ứng nên mức đề xuất bị giới hạn ở 'Consider'.";
  }
  return { recommendation: level, downgraded_reason: reason };
}

export type Utterance = { turn_index: number; role: "ai" | "candidate"; content: string };

/**
 * Giữ lại chỉ những trích dẫn có thật trong lời ứng viên (tại đúng lượt hoặc bất kỳ lượt nào nếu turn_index sai).
 * Trích dẫn bịa → bị loại và được đếm để báo cáo minh bạch.
 */
export function verifyEvidence<T extends { quote: string; turn_index: number }>(
  items: T[],
  utterances: Utterance[],
): { kept: T[]; dropped: number } {
  const cand = utterances.filter((u) => u.role === "candidate");
  const kept: T[] = [];
  let dropped = 0;
  for (const it of items) {
    const exact = cand.find((u) => u.turn_index === it.turn_index);
    if (exact && quoteAppearsIn(it.quote, exact.content)) {
      kept.push(it);
      continue;
    }
    const any = cand.find((u) => quoteAppearsIn(it.quote, u.content));
    if (any) kept.push({ ...it, turn_index: any.turn_index });
    else dropped += 1;
  }
  return { kept, dropped };
}

/** Gắn tên + trọng số từ kế hoạch, chuẩn hóa điểm và kiểm tra trích dẫn. */
export function buildScoredCompetencies(
  raw: EvaluationRaw["competency_scores"],
  competencies: PlanCompetency[],
  utterances: Utterance[],
): { scored: ScoredCompetency[]; droppedQuotes: number } {
  let droppedQuotes = 0;
  const scored: ScoredCompetency[] = competencies.map((c) => {
    const r = raw.find((x) => x.competency_id === c.id);
    if (!r) {
      return {
        competency_id: c.id,
        name: c.name,
        weight: c.weight,
        score: 1,
        rationale: "Không có đánh giá cho năng lực này.",
        evidence: [],
        confidence: "low" as const,
        insufficient_data: true,
      };
    }
    const { kept, dropped } = verifyEvidence(r.evidence ?? [], utterances);
    droppedQuotes += dropped;
    const noEvidence = kept.length === 0;
    return {
      competency_id: c.id,
      name: c.name,
      weight: c.weight,
      // Không có bằng chứng hợp lệ → không thể cho điểm cao
      score: noEvidence ? Math.min(2, Math.round(clamp(r.score, 1, 5))) : Math.round(clamp(r.score, 1, 5)),
      rationale: r.rationale,
      evidence: kept,
      confidence: noEvidence ? ("low" as const) : r.confidence,
      insufficient_data: noEvidence ? true : r.insufficient_data,
    };
  });
  return { scored, droppedQuotes };
}

/** Số lượt hỏi theo thời lượng, chia cho các chặng, giữ nguyên tổng ngân sách. */
export function allocateStageTurns(
  stages: { key: string; planned_turns: number }[],
  budget: number,
): number[] {
  if (!stages.length) return [];
  const fixed = stages.map((s) => (s.key === "candidate_questions" ? 1 : s.key === "closing" ? 0 : null));
  const fixedTotal = fixed.reduce<number>((s, f) => s + (f ?? 0), 0);
  const flexIdx = fixed.map((f, i) => (f === null ? i : -1)).filter((i) => i >= 0);
  const flexBudget = Math.max(flexIdx.length, budget - fixedTotal);
  const weights = flexIdx.map((i) => Math.max(1, stages[i].planned_turns || 1));
  const wSum = weights.reduce((s, w) => s + w, 0);
  const alloc = weights.map((w) => Math.max(1, Math.floor((w / wSum) * flexBudget)));
  let diff = flexBudget - alloc.reduce((s, a) => s + a, 0);
  for (let k = 0; diff > 0 && alloc.length; k = (k + 1) % alloc.length) {
    alloc[k] += 1;
    diff -= 1;
  }
  while (diff < 0) {
    let maxI = 0;
    alloc.forEach((a, i) => {
      if (a > alloc[maxI]) maxI = i;
    });
    if (alloc[maxI] <= 1) break;
    alloc[maxI] -= 1;
    diff += 1;
  }
  const result: number[] = [];
  let f = 0;
  stages.forEach((_, i) => {
    if (fixed[i] !== null) result.push(fixed[i] as number);
    else result.push(alloc[f++]);
  });
  return result;
}
