import OpenAI from "openai";
import { generateTTSAudio } from "@/app/api/interview/_lib/ai";
import { M3_LIMITS, M3_MODELS } from "@/lib/m3/config";
import { decideNextTurn, progressOf, type TurnRecord } from "@/lib/m3/orchestrator";
import {
  HttpError,
  authed,
  errorResponse,
  json,
  loadInterview,
  makeLlmContext,
  saveCost,
} from "@/lib/m3/server";
import { truncate } from "@/lib/m3/text";

export const runtime = "nodejs";
export const maxDuration = 60;

type MsgRow = { turn_index: number; role: "interviewer" | "candidate"; content: string; meta: Record<string, unknown> | null };

const TTS_VOICE: Record<string, "alloy" | "nova" | "shimmer"> = { marin: "shimmer", cedar: "alloy", alloy: "alloy", shimmer: "shimmer", verse: "nova" };

/**
 * Nhận câu trả lời của ứng viên → Orchestrator → câu hỏi kế tiếp.
 * Body JSON: { answer, via?: "realtime"|"text", duration_sec? }
 * hoặc multipart: audio (pipeline dự phòng: Whisper/transcribe → Orchestrator → TTS).
 * Idempotent: gửi lại cùng lượt sẽ trả lại kết quả đã lưu, không hỏi lại / không trừ chi phí.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);
    if (it.row.status !== "in_progress") throw new HttpError(409, "NOT_IN_PROGRESS", "Buổi phỏng vấn chưa bắt đầu hoặc đã kết thúc.");
    if (!it.plan || !it.cv || !it.jd || !it.match) throw new HttpError(409, "NOT_READY", "Thiếu dữ liệu phỏng vấn.");

    /* ── 1. Lấy câu trả lời (JSON hoặc audio) ── */
    let answer = "";
    let via: "realtime" | "text" | "audio" = "realtime";
    let durationSec: number | null = null;
    let wantAudio = false;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio");
      if (!(audio instanceof File) || audio.size === 0) throw new HttpError(400, "AUDIO_REQUIRED", "Chưa có bản ghi âm.");
      if (audio.size > 12 * 1024 * 1024) throw new HttpError(400, "AUDIO_TOO_LARGE", "Bản ghi âm quá lớn.");
      via = "audio";
      wantAudio = String(form.get("want_audio")) !== "false";
      durationSec = Number(form.get("duration_sec")) || null;
      const { ctx } = makeLlmContext(db, user.id, id, Number(it.row.cost_usd));
      const started = Date.now();
      const stt = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).audio.transcriptions.create({
        file: audio,
        model: M3_MODELS.transcribe,
        language: it.config.language,
      });
      answer = (stt.text ?? "").trim();
      await ctx.sink?.({
        stage: "stt",
        model: M3_MODELS.transcribe,
        tokens_in: 0,
        tokens_out: 0,
        latency_ms: Date.now() - started,
        cost_usd: ((durationSec ?? 30) / 60) * 0.003,
        ok: true,
        error: null,
      });
    } else {
      const body = (await req.json().catch(() => ({}))) as { answer?: string; via?: string; duration_sec?: number; want_audio?: boolean };
      answer = String(body.answer ?? "").trim();
      via = body.via === "text" ? "text" : "realtime";
      durationSec = Number(body.duration_sec) || null;
      wantAudio = body.want_audio === true;
    }
    if (!answer) throw new HttpError(400, "EMPTY_ANSWER", "Không nhận được nội dung câu trả lời.");
    answer = truncate(answer, M3_LIMITS.maxAnswerChars);

    /* ── 2. Tải lịch sử, xác định câu hỏi đang chờ trả lời ── */
    const { data: rows, error: rowsErr } = await db
      .from("m3_messages")
      .select("turn_index, role, content, meta")
      .eq("interview_id", id)
      .eq("user_id", user.id)
      .order("turn_index");
    if (rowsErr) throw rowsErr;
    const msgs = (rows ?? []) as MsgRow[];
    const interviewerMsgs = msgs.filter((m) => m.role === "interviewer");
    const lastQ = interviewerMsgs[interviewerMsgs.length - 1];
    if (!lastQ) throw new HttpError(409, "NO_QUESTION", "Chưa có câu hỏi nào để trả lời.");
    const alreadyAnswered = msgs.some((m) => m.role === "candidate" && m.turn_index === lastQ.turn_index);

    if (it.state.done) {
      return json({ question: lastQ.content, action: "closing", done: true, counted: false, progress: progressOf(it.plan, it.state), replay: true });
    }
    if (alreadyAnswered) {
      // Gửi trùng: trả lại câu hỏi kế tiếp đã tạo (nếu có) thay vì xử lý lại
      return json({
        question: lastQ.content,
        action: (lastQ.meta?.action as string) ?? "follow_up",
        done: it.state.done,
        counted: true,
        progress: progressOf(it.plan, it.state),
        replay: true,
        turn_index: lastQ.turn_index,
      });
    }

    const history: TurnRecord[] = [];
    for (const q of interviewerMsgs) {
      if (q.turn_index === lastQ.turn_index) continue;
      const a = msgs.find((m) => m.role === "candidate" && m.turn_index === q.turn_index);
      if (a) history.push({ turn: q.turn_index, question: q.content, answer: a.content });
    }
    const elapsedSec = it.row.started_at ? (Date.now() - new Date(it.row.started_at).getTime()) / 1000 : 0;

    /* ── 3. Orchestrator ── */
    const { ctx, getCost } = makeLlmContext(db, user.id, id, Number(it.row.cost_usd));
    const out = await decideNextTurn(
      { plan: it.plan, cv: it.cv, jd: it.jd, match: it.match, config: it.config, state: it.state, history, lastQuestion: lastQ.content, answer, elapsedSec },
      ctx,
    );

    /* ── 4. Lưu ── */
    if (!out.counted) {
      // Làm rõ / nhắc lại: không tính lượt; ghi vào meta của câu hỏi hiện tại
      const prevClar = (Array.isArray(lastQ.meta?.clarifications) ? lastQ.meta?.clarifications : []) as unknown[];
      await db
        .from("m3_messages")
        .update({ meta: { ...(lastQ.meta ?? {}), clarifications: [...prevClar, { candidate: answer, interviewer: out.question }] } })
        .eq("interview_id", id)
        .eq("turn_index", lastQ.turn_index)
        .eq("role", "interviewer");
      await db.from("m3_interviews").update({ state: out.state }).eq("id", id).eq("user_id", user.id);
      await saveCost(db, id, getCost());
      const audio = wantAudio ? await generateTTSAudio(out.question, TTS_VOICE[it.config.voice] ?? "shimmer") : null;
      return json({
        question: out.question,
        action: out.action,
        done: false,
        counted: false,
        progress: progressOf(it.plan, out.state),
        transcript: via === "audio" ? answer : undefined,
        audio_base64: audio ? audio.toString("base64") : null,
        audio_mime: "audio/mpeg",
      });
    }

    const { error: candErr } = await db.from("m3_messages").insert({
      interview_id: id,
      user_id: user.id,
      turn_index: lastQ.turn_index,
      role: "candidate",
      content: answer,
      meta: { via, duration_sec: durationSec },
    });
    if (candErr) {
      // 23505 = trùng khóa: lượt này vừa được xử lý ở request khác
      if ((candErr as { code?: string }).code === "23505") throw new HttpError(409, "DUPLICATE_TURN", "Lượt này đã được xử lý.");
      throw candErr;
    }

    if (out.evidence.length) {
      await db.from("m3_competency_evidence").insert(
        out.evidence.map((e) => ({
          interview_id: id,
          user_id: user.id,
          turn_index: lastQ.turn_index,
          competency_id: e.competency,
          quote: e.quote,
          signal: e.signal,
          strength: e.strength,
          star: e.star,
        })),
      );
    }

    const nextIndex = out.action === "closing" ? lastQ.turn_index + 1 : out.state.turn_count;
    await db.from("m3_messages").insert({
      interview_id: id,
      user_id: user.id,
      turn_index: nextIndex,
      role: "interviewer",
      content: out.question,
      meta: {
        action: out.action,
        competency: out.decision?.competency ?? null,
        stage: out.decision?.stage_key ?? out.action,
        reason: out.decision?.reason ?? null,
        guards: out.guard_notes,
      },
    });

    // Cập nhật có điều kiện: chỉ ghi nếu state chưa bị request khác thay đổi
    const { data: upd, error: upErr } = await db
      .from("m3_interviews")
      .update({ state: out.state })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("state->>turn_count", String(it.state.turn_count))
      .select("id");
    if (upErr) throw upErr;
    if (!upd?.length) console.warn("[m3] state update skipped (concurrent turn)", id);
    await saveCost(db, id, getCost());

    const audio = wantAudio ? await generateTTSAudio(out.question, TTS_VOICE[it.config.voice] ?? "shimmer") : null;
    return json({
      question: out.question,
      action: out.action,
      done: out.done,
      counted: true,
      turn_index: nextIndex,
      progress: progressOf(it.plan, out.state),
      transcript: via === "audio" ? answer : undefined,
      audio_base64: audio ? audio.toString("base64") : null,
      audio_mime: "audio/mpeg",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
