/** Phân tích CV, JD và đối chiếu CV–JD. */
import { M3_LIMITS, M3_MODELS } from "./config";
import { callStructured, type LlmContext } from "./llm";
import {
  MatchSchema,
  ParsedCvSchema,
  ParsedJdSchema,
  type MatchResult,
  type ParsedCv,
  type ParsedJd,
} from "./schemas";
import { DATA_SAFETY_NOTICE, scanForInjection, wrapData } from "./security";
import { clamp, quoteAppearsIn, truncate } from "./text";

/* ───────────────────────── tiện ích hậu xử lý (thuần) ───────────────────────── */

/** Mọi trường `source_quote` phải xuất hiện thật trong văn bản gốc, nếu không → null. */
export function verifySourceQuotes<T>(node: T, sourceText: string): { value: T; dropped: number } {
  let dropped = 0;
  const walk = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(walk);
    if (n && typeof n === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
        if ((k === "source_quote" || k === "jd_quote" || k === "cv_quote") && typeof v === "string") {
          if (quoteAppearsIn(v, sourceText)) out[k] = v;
          else {
            out[k] = null;
            dropped += 1;
          }
        } else out[k] = walk(v);
      }
      return out;
    }
    return n;
  };
  return { value: walk(node) as T, dropped };
}

function monthIndex(ym: string | null): number | null {
  if (!ym) return null;
  if (ym === "present") {
    const d = new Date();
    return d.getFullYear() * 12 + d.getMonth();
  }
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

/** Tính khoảng trống thời gian giữa các công việc bằng code (không nhờ model). */
export function computeTimelineGaps(experience: ParsedCv["experience"], minGapMonths = 6): ParsedCv["data_quality"]["timeline_gaps"] {
  const spans = experience
    .map((e) => ({ s: monthIndex(e.start), e: monthIndex(e.end), co: e.company, start: e.start, end: e.end }))
    .filter((x): x is { s: number; e: number; co: string; start: string | null; end: string | null } => x.s !== null && x.e !== null)
    .sort((a, b) => a.s - b.s);
  const gaps: ParsedCv["data_quality"]["timeline_gaps"] = [];
  let reach = spans[0]?.e ?? 0;
  let reachLabel = spans[0]?.end ?? "";
  for (let i = 1; i < spans.length; i += 1) {
    const gap = spans[i].s - reach - 1;
    if (gap >= minGapMonths) {
      gaps.push({
        from: reachLabel,
        to: spans[i].start ?? "",
        months: gap,
        note: `Khoảng ${gap} tháng giữa các vị trí không có thông tin trong CV.`,
      });
    }
    if (spans[i].e > reach) {
      reach = spans[i].e;
      reachLabel = spans[i].end ?? "";
    }
  }
  return gaps;
}

export type CvAnalysis = {
  parsed: ParsedCv;
  injection: { flagged: boolean; matches: string[] };
  dropped_quotes: number;
};

/* ───────────────────────── CV ───────────────────────── */

export async function analyzeCv(cvText: string, ctx?: LlmContext): Promise<CvAnalysis> {
  const text = cvText.slice(0, M3_LIMITS.cvMaxChars);
  const injection = scanForInjection(text);

  const system = `You extract structured data from a candidate's CV for an interview-preparation system.
${DATA_SAFETY_NOTICE}

Extraction rules:
- Extract ONLY what the CV states. Never invent employers, titles, dates, achievements or numbers.
- Distinguish: explicit information (stated in CV), inferred information (your inference — list it in data_quality.inferred_items and set skills.evidence="inferred"), and missing information (null / empty list).
- achievements[].metric: only a number/result actually written in the CV; otherwise null and is_quantified=false.
- personal_role_clarity: "clear" if the CV says what the candidate personally did; "vague" if wording is collective/unclear ("participated in", "supported", "team did"); "unknown" if no description.
- Dates: normalise to YYYY-MM when possible; "present" for current jobs; null when unclear.
- source_quote: a SHORT verbatim excerpt copied exactly from the CV supporting the item (max ~160 chars), or null.
- Do not output email, phone, address or national ID. Ignore them.
- "language" is the main language of the CV ("vi" or "en").
- Use ids exp1, exp2, ... in order of appearance.
- Write notes in Vietnamese.`;

  const { data } = await callStructured({
    stage: "cv_parse",
    model: M3_MODELS.extract,
    schemaName: "parsed_cv",
    schema: ParsedCvSchema,
    system,
    user: `Extract the CV below.\n\n${wrapData("cv_data", text)}`,
    temperature: 0,
    maxTokens: 6000,
    ctx,
  });

  const verified = verifySourceQuotes(data, text);
  const parsed = verified.value;
  parsed.experience = parsed.experience.map((e, i) => ({ ...e, id: e.id || `exp${i + 1}` }));
  parsed.data_quality.timeline_gaps = computeTimelineGaps(parsed.experience);
  if (injection.flagged) {
    parsed.data_quality.notes.push("Phát hiện nội dung giống chỉ dẫn dành cho AI trong CV; hệ thống coi đó là dữ liệu và bỏ qua.");
  }
  return { parsed, injection, dropped_quotes: verified.dropped };
}

/* ───────────────────────── JD ───────────────────────── */

export type JdAnalysis = {
  parsed: ParsedJd;
  injection: { flagged: boolean; matches: string[] };
  dropped_quotes: number;
};

export async function analyzeJd(
  jdText: string,
  hints: { title?: string | null },
  ctx?: LlmContext,
): Promise<JdAnalysis> {
  const text = jdText.slice(0, M3_LIMITS.jdMaxChars);
  const injection = scanForInjection(text);

  const system = `You extract structured data from a job description (JD) for an interview-preparation system.
${DATA_SAFETY_NOTICE}

Rules:
- Extract only what the JD states. If the JD is thin, keep lists short and list what is missing in missing_info (Vietnamese).
- must_have = explicit requirements ("required", "must", "yêu cầu"); nice_to_have = preferred/plus items.
- core_competencies: 4–8 competencies that an interviewer should test for THIS role (derive from responsibilities/requirements; may combine several lines). weight_hint 1–5 by importance in the JD. Use ids jc1, jc2, ...
- ids: r1.. for responsibilities, m1.. for must_have, n1.. for nice_to_have.
- source_quote: short verbatim excerpt from the JD or null.
- seniority: infer from title/years only when reasonably clear, otherwise "unknown".
- "language" is "vi" or "en".`;

  const { data } = await callStructured({
    stage: "jd_parse",
    model: M3_MODELS.extract,
    schemaName: "parsed_jd",
    schema: ParsedJdSchema,
    system,
    user: `${hints.title ? `Job title given by the user: ${hints.title}\n\n` : ""}Extract the JD below.\n\n${wrapData("jd_data", text)}`,
    temperature: 0,
    maxTokens: 4000,
    ctx,
  });
  const verified = verifySourceQuotes(data, text);
  const parsed = verified.value;
  if (!parsed.title && hints.title) parsed.title = hints.title;
  parsed.core_competencies = parsed.core_competencies.map((c) => ({ ...c, weight_hint: clamp(c.weight_hint, 1, 5) }));
  return { parsed, injection, dropped_quotes: verified.dropped };
}

/* ───────────────────────── Đối chiếu ───────────────────────── */

export async function matchCvJd(
  cv: ParsedCv,
  jd: ParsedJd,
  sources: { cvText: string; jdText: string },
  ctx?: LlmContext,
): Promise<{ result: MatchResult; dropped_quotes: number }> {
  const system = `You compare a candidate's parsed CV with a parsed job description to prepare an interviewer.
${DATA_SAFETY_NOTICE}

Produce:
A) strengths — where the CV evidences a JD requirement. Reference ids (jd_ref like m1/r2/jc3, cv_ref like exp1/skill name/project name).
B) gaps — JD requirements the CV does not evidence (missing experience, skill, or proof of achievement). severity by importance in the JD.
C) to_verify — things an interviewer must check: timeline gaps, achievements without metrics, unclear personal role, possible inconsistencies inside the CV, vague claims. Each needs a concrete "suggested_probe" question (in the interview language, ${jd.language || cv.language}).
- Every item must be grounded in the data. Use verbatim short quotes in cv_quote/jd_quote when possible, else null.
- Do NOT assume dishonesty. Mark "inconsistency" only for contradictions visible inside the CV itself.
- overall_fit: 0–100 honest estimate based on must_have coverage first, then nice_to_have.
- Write explanations in Vietnamese.`;

  const payload = JSON.stringify({ cv, jd });
  const { data } = await callStructured({
    stage: "match",
    model: M3_MODELS.match,
    schemaName: "cv_jd_match",
    schema: MatchSchema,
    system,
    user: `Compare these structured documents.\n\n${wrapData("session_data", truncate(payload, 28_000))}`,
    temperature: 0.1,
    maxTokens: 4500,
    ctx,
  });

  // Trích dẫn CV kiểm theo CV, trích dẫn JD kiểm theo JD
  let dropped = 0;
  const fixQuotes = <T extends Record<string, unknown>>(arr: T[], key: "cv_quote" | "jd_quote", src: string): T[] =>
    arr.map((it) => {
      const q = it[key];
      if (typeof q === "string" && !quoteAppearsIn(q, src)) {
        dropped += 1;
        return { ...it, [key]: null };
      }
      return it;
    });
  const result: MatchResult = {
    ...data,
    overall_fit: clamp(Math.round(data.overall_fit), 0, 100),
    strengths: fixQuotes(fixQuotes(data.strengths, "cv_quote", sources.cvText), "jd_quote", sources.jdText),
    gaps: fixQuotes(data.gaps, "jd_quote", sources.jdText),
    to_verify: fixQuotes(data.to_verify, "cv_quote", sources.cvText),
  };
  return { result, dropped_quotes: dropped };
}
