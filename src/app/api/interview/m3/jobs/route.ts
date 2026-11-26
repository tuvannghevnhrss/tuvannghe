import { z } from "zod";
import { analyzeJd } from "@/lib/m3/analysis";
import { M3_LIMITS } from "@/lib/m3/config";
import { HttpError, authed, errorResponse, expiresAtIso, json, makeLlmContext } from "@/lib/m3/server";
import { cleanExtractedText } from "@/lib/m3/text";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  title: z.string().trim().min(2).max(120),
  text: z.string(),
});

export async function GET() {
  try {
    const { user, db } = await authed();
    const { data, error } = await db
      .from("m3_job_descriptions")
      .select("id, title, language, status, created_at, expires_at, parsed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return json({ jobs: data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Nhập JD (văn bản) → phân tích. */
export async function POST(req: Request) {
  try {
    const { user, db } = await authed();
    const body = Body.parse(await req.json().catch(() => ({})));
    const text = cleanExtractedText(body.text);
    if (text.length < M3_LIMITS.jdMinChars) {
      throw new HttpError(400, "JD_TOO_SHORT", `JD quá ngắn (tối thiểu ${M3_LIMITS.jdMinChars} ký tự).`);
    }
    if (text.length > M3_LIMITS.jdMaxChars) {
      throw new HttpError(400, "JD_TOO_LONG", `JD quá dài (tối đa ${M3_LIMITS.jdMaxChars} ký tự).`);
    }
    const { ctx } = makeLlmContext(db, user.id, null);
    const analysis = await analyzeJd(text, { title: body.title }, ctx);
    const { data, error } = await db
      .from("m3_job_descriptions")
      .insert({
        user_id: user.id,
        title: body.title,
        raw_text: text,
        language: analysis.parsed.language,
        parsed: analysis.parsed,
        injection: { ...analysis.injection, dropped_quotes: analysis.dropped_quotes },
        status: "ready",
        expires_at: expiresAtIso(),
      })
      .select("id, title, language, status, created_at, expires_at, parsed, injection")
      .single();
    if (error) throw error;
    return json({ job: data }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
