import { createInterviewPlan } from "@/lib/m3/planner";
import { initialState } from "@/lib/m3/orchestrator";
import {
  ConfigInputSchema,
  HttpError,
  authed,
  errorResponse,
  json,
  loadInterview,
  makeLlmContext,
  saveCost,
} from "@/lib/m3/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Lập (hoặc lập lại) kế hoạch phỏng vấn. Có thể gửi kèm config mới. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);
    if (it.row.status === "in_progress" || it.row.status === "completed") {
      throw new HttpError(409, "ALREADY_STARTED", "Buổi phỏng vấn đã bắt đầu, không thể lập lại kế hoạch.");
    }
    if (!it.cv || !it.jd || !it.match) throw new HttpError(409, "NOT_READY", "Chưa có đủ dữ liệu CV/JD/đối chiếu.");

    const body = (await req.json().catch(() => ({}))) as { config?: unknown };
    const config = body.config ? ConfigInputSchema.parse({ ...it.config, ...(body.config as object) }) : it.config;

    const { ctx, getCost } = makeLlmContext(db, user.id, id, Number(it.row.cost_usd));
    const plan = await createInterviewPlan({ cv: it.cv, jd: it.jd, match: it.match, config }, ctx);
    const { error } = await db
      .from("m3_interviews")
      .update({ config, plan, state: initialState(config), status: "planned" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await saveCost(db, id, getCost());
    return json({ plan, config });
  } catch (err) {
    return errorResponse(err);
  }
}
