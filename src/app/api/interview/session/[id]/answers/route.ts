import OpenAI from "openai";
import { createAnswerFeedback } from "../../../_lib/ai";
import { requireInterviewUser } from "../../../_lib/auth";
import {
  getFallbackDifficultyName,
  getFallbackExperienceName,
  getFallbackRoleName,
  isLocalInterviewSessionId,
} from "../../../_lib/data";
import { createInterviewSupabaseClient } from "../../../_lib/supabase";

async function transcribeAudio(
  file: File,
  promptText: string,
  transcriptFallback?: string,
  languageCode?: string
) {
  const fallbackText = transcriptFallback || `Ban dang tra loi cau hoi: ${promptText}`;

  if (!process.env.OPENAI_API_KEY) {
    return {
      text: fallbackText,
      source: transcriptFallback ? "browser_fallback" : "prompt_fallback",
      fallback_reason: "missing_openai_api_key",
    } as const;
  }

  try {
    const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: languageCode === "en" ? "en" : "vi",
    });

    return {
      text: response.text ?? fallbackText,
      source: "whisper",
      fallback_reason: null,
    } as const;
  } catch (error) {
    console.error("Whisper transcription fallback:", error);
    return {
      text: fallbackText,
      source: transcriptFallback ? "browser_fallback" : "prompt_fallback",
      fallback_reason: error instanceof Error ? error.message : "whisper_failed",
    } as const;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const form = await req.formData();

    const questionIdRaw = form.get("question_id");
    const promptText = String(form.get("prompt_text") ?? "").trim();
    const transcriptText = String(form.get("transcript_text") ?? "").trim();
    const languageCode = String(form.get("language_code") ?? "vi").trim();
    const answerIndex = Number(form.get("answer_index") ?? 0);
    const questionId =
      typeof questionIdRaw === "string" && questionIdRaw.length > 0
        ? Number(questionIdRaw)
        : null;

    // ── Local mode (session tạo tạm khi backend lỗi lúc khởi tạo) — giữ
    // nguyên hành vi cũ, không có DB/storage thật để liên kết take. ────────
    if (isLocalInterviewSessionId(sessionId)) {
      const file = form.get("audio") as File | null;
      if (!file) {
        return Response.json({ error: "AUDIO_REQUIRED" }, { status: 400 });
      }

      const transcription = await transcribeAudio(file, promptText, transcriptText, languageCode);

      const feedback = await createAnswerFeedback({
        question: promptText || "Cau hoi phong van",
        transcript: transcription.text ?? "",
        languageCode,
      });

      return Response.json({
        answer_id: `local-answer-${answerIndex}`,
        transcript: transcription.text ?? "",
        feedback,
        audio_path: `local/${sessionId}/${answerIndex}`,
        local_mode: true,
        transcript_source: transcription.source,
        transcript_fallback_reason: transcription.fallback_reason,
      });
    }

    // ── Session thật: phân tích 1 take ĐÃ được upload trước đó qua
    // POST .../takes — không nhận audio thô ở đây nữa (tránh upload lại). ──
    const takeId = String(form.get("take_id") ?? "").trim();
    if (!takeId) {
      return Response.json({ error: "TAKE_ID_REQUIRED" }, { status: 400 });
    }

    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    // KHÔNG join interview_roles/interview_difficulty_levels/interview_experience_levels
    // ở đây — Module 1 thường tạo session với các FK này = null (câu hỏi tuỳ chỉnh
    // theo JD/CV), và join qua các bảng đó có thể khiến PostgREST không trả về
    // hàng session dù session tồn tại và thuộc đúng user. Đây chính là nguyên
    // nhân SESSION_NOT_FOUND tái xuất hiện sau khi đã sửa route GET. Tên vai
    // trò/độ khó/kinh nghiệm được resolve từ config.session_meta (đã lưu lúc
    // tạo session) + fallback, giống hệt cách GET /session/[id] đã làm đúng.
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const sessionMeta = session.config?.session_meta ?? null;
    const roleName = sessionMeta?.roleName ?? getFallbackRoleName(session.role_id);
    const difficultyName = sessionMeta?.difficultyName ?? getFallbackDifficultyName(session.difficulty_level_id);
    const experienceLevelName =
      sessionMeta?.experienceLevelName ?? getFallbackExperienceName(session.experience_level_id);

    // Take phải thuộc đúng session này (không tin take_id từ client mù quáng)
    const { data: take, error: takeError } = await supabase
      .from("interview_answer_takes")
      .select("id, storage_path, duration_seconds, answer_index")
      .eq("id", takeId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (takeError || !take) {
      return Response.json({ error: "TAKE_NOT_FOUND" }, { status: 404 });
    }

    // ── Idempotency: 1 answer hiện tại / (session_id, answer_index).
    // Có sẵn → UPDATE (đổi selected_take_id + phân tích lại).
    // Chưa có → INSERT.  Không bao giờ tạo answer thứ 2 cho cùng câu hỏi. ──
    const { data: existingAnswers, error: existingAnswerError } = await supabase
      .from("interview_answers")
      .select("id")
      .eq("session_id", sessionId)
      .eq("answer_index", answerIndex)
      .not("id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingAnswerError) {
      throw existingAnswerError;
    }

    const existingAnswer = existingAnswers?.[0] ?? null;

    let answerId: string;
    if (existingAnswer) {
      answerId = existingAnswer.id;
      const { error: updateExistingError } = await supabase
        .from("interview_answers")
        .update({ status: "processing", selected_take_id: take.id })
        .eq("id", answerId);

      if (updateExistingError) {
        throw updateExistingError;
      }
    } else {
      answerId = crypto.randomUUID();
      const { data: created, error: createError } = await supabase
        .from("interview_answers")
        .insert({
          id: answerId,
          session_id: sessionId,
          question_id: questionId,
          prompt_text: promptText,
          answer_index: answerIndex,
          selected_take_id: take.id,
          audio_url: take.storage_path,
          duration_seconds: take.duration_seconds ?? 0,
          status: "processing",
        })
        .select("id")
        .single();

      if (createError || !created) {
        throw createError ?? new Error("ANSWER_INSERT_FAILED");
      }
      if (!created.id) {
        throw new Error("ANSWER_ID_MISSING");
      }
      answerId = created.id;
    }

    try {
      const { data: audioBlob, error: downloadError } = await supabase.storage
        .from("interview-audio")
        .download(take.storage_path);

      if (downloadError || !audioBlob) {
        throw downloadError ?? new Error("AUDIO_DOWNLOAD_FAILED");
      }

      const file = new File([audioBlob], "take.webm", { type: audioBlob.type || "audio/webm" });

      const transcription = await transcribeAudio(
        file,
        promptText,
        transcriptText,
        session.language_code ?? languageCode
      );

      const resolvedQuestion =
        promptText ||
        (questionId
          ? (
              await supabase
                .from("interview_questions")
                .select("content")
                .eq("id", questionId)
                .maybeSingle()
            ).data?.content
          : "") ||
        "Cau hoi phong van";

      const feedback = await createAnswerFeedback({
        question: resolvedQuestion,
        transcript: transcription.text ?? "",
        roleName,
        difficultyName,
        experienceLevelName,
        languageCode: session.language_code ?? languageCode,
      });

      const { error: updateError } = await supabase
        .from("interview_answers")
        .update({
          prompt_text: resolvedQuestion,
          selected_take_id: take.id,
          audio_url: take.storage_path,
          transcript: transcription.text ?? "",
          duration_seconds: take.duration_seconds ?? 0,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", answerId);

      if (updateError) throw updateError;

      // KHÔNG dùng upsert(onConflict: 'answer_id') — DB thật không có UNIQUE
      // constraint trên cột này (dù migration gốc có khai báo), nên Postgres
      // báo lỗi 42P10 "no unique or exclusion constraint matching ON CONFLICT".
      // Tự kiểm tra tồn tại rồi UPDATE/INSERT, giống hệt pattern đã dùng cho
      // interview_answers — không phụ thuộc constraint nào ở DB.
      const { data: existingFeedback } = await supabase
        .from("interview_answer_feedback")
        .select("id")
        .eq("answer_id", answerId)
        .maybeSingle();

      const feedbackRow = {
        answer_id: answerId,
        score: feedback.score,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        tips: feedback.tips,
        keywords: feedback.keywords,
        raw_ai_json: feedback.raw_ai_json,
      };

      const { error: feedbackError } = existingFeedback
        ? await supabase
            .from("interview_answer_feedback")
            .update(feedbackRow)
            .eq("id", existingFeedback.id)
        : await supabase.from("interview_answer_feedback").insert(feedbackRow);

      if (feedbackError) throw feedbackError;

      await supabase
        .from("interview_sessions_v2")
        .update({ status: "recording" })
        .eq("id", sessionId);

      return Response.json({
        answer_id: answerId,
        transcript: transcription.text ?? "",
        feedback,
        audio_path: take.storage_path,
        transcript_source: transcription.source,
        transcript_fallback_reason: transcription.fallback_reason,
      });
    } catch (analysisError) {
      // Phân tích lỗi: đánh dấu answer là "failed", KHÔNG xoá take/recording,
      // user có thể bấm phân tích lại (sẽ UPDATE lại đúng answer này).
      console.error("Answer analysis failed:", analysisError);
      await supabase.from("interview_answers").update({ status: "failed" }).eq("id", answerId);
      throw analysisError;
    }
  } catch (error) {
    console.error("POST /api/interview/session/[id]/answers:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    return Response.json({ error: "UPLOAD_OR_ANALYSIS_FAILED" }, { status: 500 });
  }
}
