import { canUseModule, DB_MODULE_TYPE } from "@/app/api/interview/_lib/access";
import { openInterview, progressOf } from "@/lib/m3/orchestrator";
import { HttpError, authed, errorResponse, json, loadInterview } from "@/lib/m3/server";

export const runtime = "nodejs";

/**
 * Bắt đầu phỏng vấn (hoặc tiếp tục nếu đang dở — dùng cho reconnect).
 * Lần bắt đầu đầu tiên mới trừ 1 lượt Module 3 (qua bản ghi interview_sessions_v2).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);

    if (it.row.status === "completed") throw new HttpError(409, "ALREADY_COMPLETED", "Buổi phỏng vấn đã kết thúc.");
    if (!it.plan || !it.cv || !it.jd) throw new HttpError(409, "NOT_PLANNED", "Hãy lập kế hoạch phỏng vấn trước.");

    // Tiếp tục buổi đang dở: trả câu hỏi gần nhất chưa được trả lời
    if (it.row.status === "in_progress") {
      const { data: msgs } = await db
        .from("m3_messages")
        .select("turn_index, role, content, meta")
        .eq("interview_id", id)
        .eq("user_id", user.id)
        .order("turn_index");
      const interviewerMsgs = (msgs ?? []).filter((m) => m.role === "interviewer");
      const last = interviewerMsgs[interviewerMsgs.length - 1];
      return json({
        resumed: true,
        question: last?.content ?? "",
        turn_index: last?.turn_index ?? 1,
        done: it.state.done,
        messages: msgs ?? [],
        progress: progressOf(it.plan, it.state),
        started_at: it.row.started_at,
        config: it.config,
      });
    }

    // Hạn mức Module 3 (tái dùng cơ chế hiện có)
    if (!it.row.session_id) {
      const allowed = await canUseModule(user.id, "module3");
      if (!allowed) {
        throw new HttpError(403, "QUOTA_EXCEEDED", "Bạn đã dùng hết lượt Module 3. Nâng cấp gói để tiếp tục.");
      }
    }

    let sessionId = it.row.session_id;
    if (!sessionId) {
      const { data: session, error: sErr } = await db
        .from("interview_sessions_v2")
        .insert({
          user_id: user.id,
          module_type: DB_MODULE_TYPE.module3,
          status: "recording",
          language_code: it.config.language,
          job_title: it.jdTitle || null,
          config: { v2: true, m3_interview_id: id },
        })
        .select("id")
        .single();
      if (sErr) throw sErr;
      sessionId = session.id;
    }

    const { question, state } = openInterview(it.plan, it.config, it.jd.title || it.jdTitle, it.state);
    const startedAt = new Date().toISOString();

    const { error: mErr } = await db.from("m3_messages").insert({
      interview_id: id,
      user_id: user.id,
      turn_index: 1,
      role: "interviewer",
      content: question,
      meta: { action: "open", stage: it.plan.stages[0]?.key ?? "warmup" },
    });
    if (mErr) throw mErr;

    const { error } = await db
      .from("m3_interviews")
      .update({ status: "in_progress", state, session_id: sessionId, started_at: startedAt })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return json({
      resumed: false,
      question,
      turn_index: 1,
      done: false,
      messages: [{ turn_index: 1, role: "interviewer", content: question, meta: { action: "open" } }],
      progress: progressOf(it.plan, state),
      started_at: startedAt,
      config: it.config,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
