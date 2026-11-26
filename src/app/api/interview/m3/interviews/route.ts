import { z } from "zod";
import { matchCvJd } from "@/lib/m3/analysis";
import { initialState } from "@/lib/m3/orchestrator";
import type { ParsedCv, ParsedJd } from "@/lib/m3/schemas";
import {
  ConfigInputSchema,
  HttpError,
  authed,
  errorResponse,
  expiresAtIso,
  json,
  makeLlmContext,
  saveCost,
} from "@/lib/m3/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  cv_id: z.string().uuid(),
  jd_id: z.string().uuid(),
  config: ConfigInputSchema.optional(),
});

export async function GET() {
  try {
    const { user, db } = await authed();
    const { data, error } = await db
      .from("m3_interviews")
      .select("id, status, config, created_at, ended_at, m3_evaluations(overall_score, recommendation)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return json({ interviews: data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Tạo buổi phỏng vấn từ CV + JD, đồng thời tạo ma trận đối chiếu. */
export async function POST(req: Request) {
  try {
    const { user, db } = await authed();
    const body = Body.parse(await req.json().catch(() => ({})));
    const config = ConfigInputSchema.parse(body.config ?? {});

    const [{ data: cv }, { data: jd }] = await Promise.all([
      db.from("m3_cv_documents").select("id, parsed, status").eq("id", body.cv_id).eq("user_id", user.id).maybeSingle(),
      db.from("m3_job_descriptions").select("id, parsed, raw_text, status, language").eq("id", body.jd_id).eq("user_id", user.id).maybeSingle(),
    ]);
    if (!cv || cv.status !== "ready" || !cv.parsed) throw new HttpError(404, "CV_NOT_FOUND", "Không tìm thấy CV đã phân tích.");
    if (!jd || jd.status !== "ready" || !jd.parsed) throw new HttpError(404, "JD_NOT_FOUND", "Không tìm thấy JD đã phân tích.");

    const { data: created, error } = await db
      .from("m3_interviews")
      .insert({
        user_id: user.id,
        cv_id: cv.id,
        jd_id: jd.id,
        config,
        state: initialState(config),
        status: "draft",
        expires_at: expiresAtIso(),
      })
      .select("id")
      .single();
    if (error) throw error;

    const { ctx, getCost } = makeLlmContext(db, user.id, created.id);
    try {
      const { result } = await matchCvJd(
        cv.parsed as ParsedCv,
        jd.parsed as ParsedJd,
        { cvText: JSON.stringify(cv.parsed), jdText: jd.raw_text as string },
        ctx,
      );
      await db.from("m3_interviews").update({ match: result }).eq("id", created.id).eq("user_id", user.id);
      await saveCost(db, created.id, getCost());
    } catch (err) {
      await db.from("m3_interviews").update({ status: "failed" }).eq("id", created.id).eq("user_id", user.id);
      throw err;
    }
    return json({ interview_id: created.id }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
