import { M3_MODELS } from "@/lib/m3/config";
import { evaluateInterview } from "@/lib/m3/evaluator";
import { HttpError, authed, errorResponse, json, loadInterview, makeLlmContext, saveCost } from "@/lib/m3/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Kết thúc phỏng vấn và tạo báo cáo đánh giá. Idempotent: gọi lại sẽ trả báo cáo đã có. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);

    const { data: existing } = await db.from("m3_evaluations").select("report, overall_score, recommendation").eq("interview_id", id).eq("user_id", user.id).maybeSingle();
    if (existing) return json({ report: existing.report, overall_score: existing.overall_score, recommendation: existing.recommendation, replay: true });

    if (!it.plan || !it.cv || !it.jd || !it.match) throw new HttpError(409, "NOT_READY", "Thiếu dữ liệu phỏng vấn.");
    if (it.row.status !== "in_progress") throw new HttpError(409, "NOT_IN_PROGRESS", "Buổi phỏng vấn chưa bắt đầu.");

    const [{ data: msgs }, { data: ev }] = await Promise.all([
      db.from("m3_messages").select("turn_index, role, content, meta").eq("interview_id", id).eq("user_id", user.id).order("turn_index"),
      db.from("m3_competency_evidence").select("competency_id, quote, signal, strength, turn_index").eq("interview_id", id).eq("user_id", user.id),
    ]);
    const rows = msgs ?? [];
    const questions = rows.filter((m) => m.role === "interviewer");
    const turns = questions
      .map((q) => ({
        turn: q.turn_index as number,
        question: q.content as string,
        answer: (rows.find((m) => m.role === "candidate" && m.turn_index === q.turn_index)?.content as string | undefined) ?? "",
      }))
      // Bỏ câu kết thúc (không có câu trả lời) ra khỏi bản chép lời được chấm
      .filter((t) => t.answer || (questions[questions.length - 1]?.turn_index !== t.turn));

    const answered = turns.filter((t) => t.answer.trim()).length;
    if (answered === 0) {
      await db.from("m3_interviews").update({ status: "abandoned", ended_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      if (it.row.session_id) await db.from("interview_sessions_v2").update({ status: "failed", ended_at: new Date().toISOString() }).eq("id", it.row.session_id).eq("user_id", user.id);
      throw new HttpError(422, "NOT_ENOUGH_DATA", "Chưa có câu trả lời nào nên chưa thể tạo báo cáo.");
    }

    const { ctx, getCost } = makeLlmContext(db, user.id, id, Number(it.row.cost_usd));
    const report = await evaluateInterview(
      {
        cv: it.cv,
        jd: it.jd,
        match: it.match,
        plan: it.plan,
        config: it.config,
        turns,
        evidence: (ev ?? []).map((e) => ({ competency: e.competency_id, quote: e.quote, signal: e.signal, strength: e.strength, turn_index: e.turn_index })),
      },
      ctx,
    );

    const { error } = await db.from("m3_evaluations").insert({
      interview_id: id,
      user_id: user.id,
      overall_score: report.overall_score,
      recommendation: report.recommendation,
      report,
      model: M3_MODELS.evaluate,
    });
    if (error) throw error;
    const endedAt = new Date().toISOString();
    await db.from("m3_interviews").update({ status: "completed", ended_at: endedAt }).eq("id", id).eq("user_id", user.id);
    if (it.row.session_id) await db.from("interview_sessions_v2").update({ status: "completed", ended_at: endedAt }).eq("id", it.row.session_id).eq("user_id", user.id);
    await saveCost(db, id, getCost());

    return json({ report, overall_score: report.overall_score, recommendation: report.recommendation, replay: false });
  } catch (err) {
    return errorResponse(err);
  }
}
