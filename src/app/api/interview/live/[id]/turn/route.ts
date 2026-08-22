import OpenAI from "openai";
import { requireInterviewUser } from "../../../_lib/auth";
import { createInterviewSupabaseClient } from "../../../_lib/supabase";
import { generateLiveQuestion, generateTTSAudio } from "../../../_lib/ai";

const LOCAL_PREFIX = "local-live-";

type ConversationTurn = { question: string; transcript: string };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const isLocal = sessionId.startsWith(LOCAL_PREFIX);

  const form = await req.formData();
  const audioFile = form.get("audio") as File | null;
  const turnOrder = Number(form.get("turn_order") ?? 0);
  const draftTranscript = String(form.get("draft_transcript") ?? "").trim();
  const durationSeconds = Number(form.get("duration_seconds") ?? 0);
  const languageCode = String(form.get("language_code") ?? "vi");
  // When retake=true, we only need a new transcript — next question already generated
  const isRetake = form.get("is_retake") === "true";

  if (!audioFile) {
    return Response.json({ error: "AUDIO_REQUIRED" }, { status: 400 });
  }

  // ── Whisper STT ──────────────────────────────────────────────────────────
  let transcript = draftTranscript;
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: languageCode === "en" ? "en" : "vi",
      });
      transcript = res.text?.trim() ?? draftTranscript;
    } catch (err) {
      console.error("Whisper fallback:", err);
    }
  }

  const currentQuestion = String(form.get("current_question") ?? "");

  // ── LOCAL MODE ───────────────────────────────────────────────────────────
  if (isLocal) {
    // Retake: only return new transcript, no question generation
    if (isRetake) {
      return Response.json({
        transcript,
        is_retake: true,
        next_turn: null,
        session_complete: false,
        turn_number: turnOrder,
      });
    }

    const conversationHistoryRaw = form.get("conversation_history");
    const conversationHistory: ConversationTurn[] = conversationHistoryRaw
      ? (JSON.parse(String(conversationHistoryRaw)) as ConversationTurn[])
      : [];

    const roleName = String(form.get("role_name") ?? "Unknown");
    const experienceLevelName = String(form.get("experience_level_name") ?? "Unknown");
    const interviewType = String(form.get("interview_type") ?? "mixed") as "behavioral" | "technical" | "mixed";
    const voice = String(form.get("voice") ?? "shimmer") as "alloy" | "nova" | "shimmer";
    const totalTurns = Number(form.get("total_turns") ?? 6);
    const isLastTurn = turnOrder >= totalTurns - 1;

    if (isLastTurn) {
      return Response.json({
        transcript,
        is_retake: false,
        next_turn: null,
        session_complete: true,
        turn_number: turnOrder,
        total_turns: totalTurns,
      });
    }

    const fullHistory: ConversationTurn[] = [
      ...conversationHistory,
      { question: currentQuestion, transcript },
    ];

    const { question: nextQuestion } = await generateLiveQuestion({
      roleName,
      experienceLevelName,
      interviewType,
      conversationHistory: fullHistory,
      turnNumber: turnOrder + 2,
      totalTurns,
      languageCode,
    });

    const nextAudioBuffer = await generateTTSAudio(nextQuestion, voice);

    return Response.json({
      transcript,
      is_retake: false,
      next_turn: {
        order: turnOrder + 1,
        question: nextQuestion,
        audio_base64: nextAudioBuffer ? nextAudioBuffer.toString("base64") : null,
        audio_mime: "audio/mpeg",
      },
      session_complete: false,
      turn_number: turnOrder + 1,
      total_turns: totalTurns,
    });
  }

  // ── AUTHENTICATED MODE ───────────────────────────────────────────────────
  try {
    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const totalTurns: number = session.config?.totalTurns ?? 6;
    const voice: "alloy" | "nova" | "shimmer" = session.config?.voice ?? "shimmer";
    const sessionLanguage: string = session.language_code ?? "vi";
    const sessionMeta = session.config?.session_meta ?? null;
    const roleName = sessionMeta?.roleName ?? "Unknown";
    const experienceLevelName = sessionMeta?.experienceLevelName ?? "Unknown";

    // Upload audio (always — even retakes overwrite with latest recording)
    const storagePath = `${user.id}/${sessionId}/live-t${turnOrder}-${Date.now()}.webm`;
    await supabase.storage
      .from("interview-audio")
      .upload(storagePath, await audioFile.arrayBuffer(), {
        contentType: audioFile.type || "audio/webm",
        upsert: true,
      });

    await supabase
      .from("interview_answers")
      .update({
        transcript,
        audio_url: storagePath,
        duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
      })
      .eq("session_id", sessionId)
      .eq("answer_index", turnOrder);

    // Retake: just return new transcript, no question generation
    if (isRetake) {
      return Response.json({
        transcript,
        is_retake: true,
        next_turn: null,
        session_complete: false,
        turn_number: turnOrder,
      });
    }

    const isLastTurn = turnOrder >= totalTurns - 1;

    if (isLastTurn) {
      await supabase
        .from("interview_sessions_v2")
        .update({ status: "processing" })
        .eq("id", sessionId);

      return Response.json({
        transcript,
        is_retake: false,
        next_turn: null,
        session_complete: true,
        turn_number: turnOrder,
        total_turns: totalTurns,
      });
    }

    const { data: previousAnswers } = await supabase
      .from("interview_answers")
      .select("answer_index, prompt_text, transcript")
      .eq("session_id", sessionId)
      .not("transcript", "is", null)
      .order("answer_index", { ascending: true });

    const conversationHistory = (previousAnswers ?? []).map(
      (a: { prompt_text: string | null; transcript: string | null }) => ({
        question: a.prompt_text ?? "",
        transcript: a.transcript ?? "",
      })
    );

    const { question: nextQuestion } = await generateLiveQuestion({
      roleName,
      experienceLevelName,
      jobTitle: session.job_title ?? undefined,
      jobDescription: session.config?.jobDescription ?? undefined,
      interviewType: session.config?.interviewType ?? "mixed",
      conversationHistory,
      turnNumber: turnOrder + 2,
      totalTurns,
      languageCode: sessionLanguage,
    });

    const nextAudioBuffer = await generateTTSAudio(nextQuestion, voice);
    const nextTurnOrder = turnOrder + 1;

    await supabase.from("interview_answers").insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      answer_index: nextTurnOrder,
      prompt_text: nextQuestion,
    });

    await supabase
      .from("interview_sessions_v2")
      .update({ status: "recording" })
      .eq("id", sessionId);

    return Response.json({
      transcript,
      is_retake: false,
      next_turn: {
        order: nextTurnOrder,
        question: nextQuestion,
        audio_base64: nextAudioBuffer ? nextAudioBuffer.toString("base64") : null,
        audio_mime: "audio/mpeg",
      },
      session_complete: false,
      turn_number: nextTurnOrder,
      total_turns: totalTurns,
    });
  } catch (error) {
    console.error("POST /api/interview/live/[id]/turn:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    return Response.json({ error: "TURN_FAILED" }, { status: 500 });
  }
}
