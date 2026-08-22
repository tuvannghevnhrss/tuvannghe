import { createSessionFeedback } from "../../../_lib/ai";
import { requireInterviewUser } from "../../../_lib/auth";
import { isLocalInterviewSessionId } from "../../../_lib/data";
import { createInterviewSupabaseClient } from "../../../_lib/supabase";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await _.json().catch(() => ({}));

    if (isLocalInterviewSessionId(sessionId)) {
      const resultId = `${sessionId}-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const sessionFeedback = await createSessionFeedback({
        roleName: body?.roleName,
        difficultyName: body?.difficultyName,
        experienceLevelName: body?.experienceLevelName,
        languageCode: body?.languageCode ?? "vi",
        answers: Array.isArray(body?.answers) ? body.answers : [],
      });

      return Response.json({
        result_id: resultId,
        local_mode: true,
        result: {
          id: resultId,
          moduleId: "module-1",
          role: body?.roleName ?? "Unknown",
          level: body?.experienceLevelName ?? "Unknown",
          createdAt,
          overallScore: sessionFeedback.overall_score,
          communicationScore: sessionFeedback.communication_score,
          contentScore: sessionFeedback.content_score,
          confidenceScore: sessionFeedback.confidence_score,
          strengths: body?.answers?.[0]?.feedback?.strengths ?? [],
          weaknesses: body?.answers?.[0]?.feedback?.weaknesses ?? [],
          suggestions:
            body?.answers?.[0]?.feedback?.tips ?? [sessionFeedback.improvement_plan].filter(Boolean),
          transcriptPreview: Array.isArray(body?.answers)
            ? body.answers
                .map((answer: any) => answer?.transcript)
                .filter(Boolean)
                .join("\n\n")
            : "",
        },
        session_feedback: sessionFeedback,
      });
    }

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

    const { data: answers, error: answersError } = await supabase
      .from("interview_answers")
      .select("id, prompt_text, transcript")
      .eq("session_id", sessionId)
      .not("id", "is", null)
      .order("answer_index", { ascending: true });

    if (answersError || !answers?.length) {
      return Response.json({ error: "NO_ANSWERS" }, { status: 400 });
    }

    const answerIds = answers.map((answer) => answer.id).filter(Boolean);
    const { data: answerFeedback, error: answerFeedbackError } = answerIds.length
      ? await supabase
          .from("interview_answer_feedback")
          .select("answer_id, score")
          .in("answer_id", answerIds)
      : { data: [], error: null };

    if (answerFeedbackError) {
      throw answerFeedbackError;
    }

    const scoreByAnswerId = new Map((answerFeedback ?? []).map((feedback) => [feedback.answer_id, feedback.score]));
    const sessionMeta = session.config?.session_meta ?? {};

    const sessionFeedback = await createSessionFeedback({
      roleName: sessionMeta.roleName ?? body?.roleName,
      difficultyName: sessionMeta.difficultyName ?? body?.difficultyName,
      experienceLevelName: sessionMeta.experienceLevelName ?? body?.experienceLevelName,
      languageCode: session.language_code ?? "vi",
      answers: answers.map((answer: any) => ({
        question: answer.prompt_text ?? "Cau hoi phong van",
        transcript: answer.transcript ?? "",
        score: scoreByAnswerId.get(answer.id) ?? null,
      })),
    });

    const { error: feedbackError } = await supabase
      .from("interview_session_feedback")
      .upsert({
        session_id: sessionId,
        overall_score: sessionFeedback.overall_score,
        communication_score: sessionFeedback.communication_score,
        content_score: sessionFeedback.content_score,
        confidence_score: sessionFeedback.confidence_score,
        summary: sessionFeedback.summary,
        improvement_plan: sessionFeedback.improvement_plan,
        raw_ai_json: sessionFeedback.raw_ai_json,
      });

    if (feedbackError) {
      throw feedbackError;
    }

    await supabase
      .from("interview_sessions_v2")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return Response.json({
      result_id: sessionId,
      session_feedback: sessionFeedback,
    });
  } catch (error) {
    console.error("POST /api/interview/session/[id]/complete:", error);
    return Response.json({ error: "COMPLETE_FAILED" }, { status: 500 });
  }
}
