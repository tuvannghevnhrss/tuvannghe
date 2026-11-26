/* Smoke test: CV → JD → match → plan → mở đầu → 2 lượt điều phối. Chạy: pnpm m3:smoke */
import { analyzeCv, analyzeJd, matchCvJd } from "../src/lib/m3/analysis";
import { createInterviewPlan } from "../src/lib/m3/planner";
import { decideNextTurn, initialState, openInterview, type TurnRecord } from "../src/lib/m3/orchestrator";
import type { UsageRecord } from "../src/lib/m3/llm";
import type { InterviewConfig } from "../src/lib/m3/schemas";
import { FIXTURES } from "../tests/m3/fixtures";

async function main() {
  const fx = FIXTURES[0];
  const usage: UsageRecord[] = [];
  const ctx = { sink: (u: UsageRecord) => void usage.push(u) };
  const t0 = Date.now();

  const cv = await analyzeCv(fx.cv, ctx);
  console.log("CV ok:", cv.parsed.experience.length, "exp,", cv.parsed.skills.length, "skills, dropped quotes", cv.dropped_quotes);
  const jd = await analyzeJd(fx.jd, { title: fx.jobTitle }, ctx);
  console.log("JD ok:", jd.parsed.must_have.length, "must-have,", jd.parsed.core_competencies.length, "competencies");
  const match = await matchCvJd(cv.parsed, jd.parsed, { cvText: fx.cv, jdText: fx.jd }, ctx);
  console.log("Match ok: fit", match.result.overall_fit, "gaps", match.result.gaps.length, "verify", match.result.to_verify.length);

  const config: InterviewConfig = { interview_type: "hiring_manager", strictness: "neutral", duration_min: 30, language: "vi", voice: "marin", candidate_name: null };
  const plan = await createInterviewPlan({ cv: cv.parsed, jd: jd.parsed, match: match.result, config }, ctx);
  console.log("Plan ok:", plan.competencies.length, "competencies,", plan.stages.map((s) => `${s.key}:${s.planned_turns}`).join(" "));

  let { question, state } = openInterview(plan, config, jd.parsed.title);
  console.log("\nAI:", question);
  const history: TurnRecord[] = [];
  for (const answer of fx.answers.slice(0, 3)) {
    console.log("\nCandidate:", answer);
    const out = await decideNextTurn({ plan, cv: cv.parsed, jd: jd.parsed, match: match.result, config, state, history, lastQuestion: question, answer, elapsedSec: 120 }, ctx);
    history.push({ turn: state.turn_count, question, answer });
    console.log(`AI [${out.action}]:`, out.question, out.guard_notes.length ? `(guards: ${out.guard_notes.join("; ")})` : "");
    console.log("   evidence:", out.evidence.map((e) => `${e.competency}/${e.signal}/${e.strength}`).join(", ") || "-");
    question = out.question;
    state = out.state;
  }
  const cost = usage.reduce((s, u) => s + u.cost_usd, 0);
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s, calls=${usage.length}, failures=${usage.filter((u) => !u.ok).length}, est. cost $${cost.toFixed(4)}`);
  void initialState;
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
