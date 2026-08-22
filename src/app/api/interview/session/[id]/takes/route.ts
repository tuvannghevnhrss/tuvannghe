import { requireInterviewUser } from "../../../_lib/auth";
import { isLocalInterviewSessionId } from "../../../_lib/data";
import { createInterviewSupabaseClient } from "../../../_lib/supabase";

const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * POST — persist 1 take NGAY sau khi user bấm "Dừng ghi âm" (không đợi tới
 * lúc phân tích), để recording không mất khi refresh trang.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const form = await req.formData();
    const file = form.get("audio") as File | null;
    const answerIndex = Number(form.get("answer_index") ?? 0);
    const durationSeconds = Number(form.get("duration_seconds") ?? 0);

    if (!file) {
      return Response.json({ error: "AUDIO_REQUIRED" }, { status: 400 });
    }

    // Session "local-*": không có DB/storage thật để lưu — giữ nguyên hành
    // vi cũ (take chỉ tồn tại trong bộ nhớ trình duyệt của chế độ demo).
    if (isLocalInterviewSessionId(sessionId)) {
      return Response.json({
        take_id: `local-take-${Date.now()}`,
        local_mode: true,
        duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      });
    }

    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const storagePath = `${user.id}/${sessionId}/q${answerIndex}/take-${crypto.randomUUID()}-${Date.now()}.webm`;
    const uploadBuffer = await file.arrayBuffer();
    const uploadRes = await supabase.storage
      .from("interview-audio")
      .upload(storagePath, uploadBuffer, {
        contentType: file.type || "audio/webm",
        upsert: false,
      });

    if (uploadRes.error) {
      throw uploadRes.error;
    }

    const { data: take, error: insertError } = await supabase
      .from("interview_answer_takes")
      .insert({
        session_id: sessionId,
        answer_index: answerIndex,
        storage_path: storagePath,
        duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
        status: "uploaded",
      })
      .select("id, created_at")
      .single();

    if (insertError || !take) {
      throw insertError ?? new Error("TAKE_INSERT_FAILED");
    }

    return Response.json({
      take_id: take.id,
      storage_path: storagePath,
      duration_seconds: durationSeconds,
      created_at: take.created_at,
    });
  } catch (error) {
    console.error("POST /api/interview/session/[id]/takes:", error);
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 500;
    return Response.json({ error: "TAKE_UPLOAD_FAILED" }, { status });
  }
}

/**
 * GET — trả toàn bộ take + answer hiện tại của session, để frontend khôi
 * phục lại state (recording, transcript, feedback) sau khi refresh trang.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    if (isLocalInterviewSessionId(sessionId)) {
      return Response.json({ takes: {}, answers: {}, local_mode: true });
    }

    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const [{ data: takeRows }, { data: answerRows, error: answerRowsError }] = await Promise.all([
      supabase
        .from("interview_answer_takes")
        .select("id, answer_index, storage_path, duration_seconds, status, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("interview_answers")
        .select("id, answer_index, selected_take_id, status, transcript")
        .eq("session_id", sessionId)
        .not("id", "is", null)
        .order("updated_at", { ascending: true }),
    ]);

    if (answerRowsError) {
      throw answerRowsError;
    }

    const takesByQuestion: Record<number, any[]> = {};
    for (const t of takeRows ?? []) {
      const { data: signed } = await supabase.storage
        .from("interview-audio")
        .createSignedUrl(t.storage_path, SIGNED_URL_TTL_SECONDS);

      (takesByQuestion[t.answer_index] ??= []).push({
        take_id: t.id,
        signed_url: signed?.signedUrl ?? null,
        duration_seconds: t.duration_seconds,
        status: t.status,
        created_at: t.created_at,
      });
    }

    const answerIds = (answerRows ?? []).map((a) => a.id).filter(Boolean);
    const { data: feedbackRows, error: feedbackRowsError } = answerIds.length
      ? await supabase
          .from("interview_answer_feedback")
          .select("answer_id, score, strengths, weaknesses, tips")
          .in("answer_id", answerIds)
      : { data: [], error: null };

    if (feedbackRowsError) {
      throw feedbackRowsError;
    }

    const feedbackByAnswerId = new Map((feedbackRows ?? []).map((f) => [f.answer_id, f]));

    const answersByQuestion: Record<number, any> = {};
    for (const a of answerRows ?? []) {
      const feedback = feedbackByAnswerId.get(a.id);
      answersByQuestion[a.answer_index] = {
        answer_id: a.id,
        selected_take_id: a.selected_take_id,
        status: a.status,
        transcript: a.transcript,
        feedback: feedback
          ? {
              score: feedback.score,
              strengths: feedback.strengths,
              weaknesses: feedback.weaknesses,
              tips: feedback.tips,
            }
          : null,
      };
    }

    return Response.json({ takes: takesByQuestion, answers: answersByQuestion });
  } catch (error) {
    console.error("GET /api/interview/session/[id]/takes:", error);
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 500;
    return Response.json({ error: "TAKES_LOAD_FAILED" }, { status });
  }
}
