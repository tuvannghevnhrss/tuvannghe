import { progressOf, coverageSummary } from "@/lib/m3/orchestrator";
import { authed, errorResponse, HttpError, json, loadInterview, normalizeConfig } from "@/lib/m3/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);

    const [{ data: messages }, { data: evaluation }, { data: cvDoc }, { data: jdDoc }] = await Promise.all([
      db.from("m3_messages").select("turn_index, role, content, meta, created_at").eq("interview_id", id).eq("user_id", user.id).order("turn_index").order("role"),
      db.from("m3_evaluations").select("overall_score, recommendation, report, created_at").eq("interview_id", id).eq("user_id", user.id).maybeSingle(),
      db.from("m3_cv_documents").select("id, file_name, language").eq("id", it.row.cv_id).maybeSingle(),
      db.from("m3_job_descriptions").select("id, title, language").eq("id", it.row.jd_id).maybeSingle(),
    ]);

    return json({
      interview: {
        id: it.row.id,
        status: it.row.status,
        config: it.config,
        match: it.match,
                // Ẩn câu hỏi gợi ý (seed_questions) để buổi luyện tập không bị lộ đề trước
        plan: it.plan ? { ...it.plan, stages: it.plan.stages.map(({ seed_questions: _seed, ...rest }) => rest) } : null,
        started_at: it.row.started_at,
        ended_at: it.row.ended_at,
        created_at: it.row.created_at,
        progress: it.plan ? progressOf(it.plan, it.state) : null,
        coverage: it.plan ? coverageSummary(it.plan, it.state) : null,
        cost_usd: it.row.cost_usd,
      },
      cv: cvDoc,
      jd: jdDoc,
      messages: messages ?? [],
      evaluation: evaluation ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Đổi cấu hình khi chưa bắt đầu (xóa kế hoạch cũ để lập lại). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);
    if (it.row.status === "in_progress" || it.row.status === "completed") {
      throw new HttpError(409, "ALREADY_STARTED", "Không thể đổi cấu hình sau khi đã bắt đầu phỏng vấn.");
    }
    const body = (await req.json().catch(() => ({}))) as { config?: unknown };
    const config = normalizeConfig({ ...it.config, ...(body.config as object) });
    const { error } = await db
      .from("m3_interviews")
      .update({ config, plan: null, status: "draft" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    return json({ config });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    await loadInterview(db, user.id, id);
    const { error } = await db.from("m3_interviews").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return json({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
