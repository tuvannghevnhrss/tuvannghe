import { requireInterviewUser } from "../../../_lib/auth";
import { createInterviewSupabaseClient } from "../../../_lib/supabase";
import { createSessionFeedback, createTurnFeedback } from "../../../_lib/ai";

const LOCAL_PREFIX = "local-live-";

type TurnEntry = {
  question: string;
  transcript: string;
  duration_seconds?: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const isLocal = sessionId.startsWith(LOCAL_PREFIX);

  const body = await req.json().catch(() => ({}));
  const turns: TurnEntry[] = Array.isArray(body?.turns) ? body.turns : [];
  const languageCode: string = body?.language_code ?? "vi";
  const roleName: string = body?.role_name ?? "Unknown";
  const experienceLevelName: string = body?.experience_level_name ?? "Unknown";

  // Run session feedback + per-turn feedback in parallel
  async function runAllFeedback(
    role: string,
    expLevel: string,
    lang: string,
    turnList: TurnEntry[]
  ) {
    const feedbackInput = turnList.map((t) => ({
      question: t.question,
      transcript: t.transcript,
      score: null,
    }));

    const [sessionFeedback, ...turnFeedbacks] = await Promise.all([
      createSessionFeedback({ roleName: role, experienceLevelName: expLevel, languageCode: lang, answers: feedbackInput }),
      ...turnList.map((t) =>
        createTurnFeedback({
          question: t.question,
          transcript: t.transcript,
          durationSeconds: t.duration_seconds ?? 0,
          languageCode: lang,
        })
      ),
    ]);

    return { sessionFeedback, turnFeedbacks };
  }

  // ── LOCAL MODE ───────────────────────────────────────────────────────────
  if (isLocal) {
    const { sessionFeedback, turnFeedbacks } = await runAllFeedback(
      roleName,
      experienceLevelName,
      languageCode,
      turns
    );

    const result = {
      id: sessionId,
      moduleId: "module-2" as const,
      role: roleName,
      level: experienceLevelName,
      createdAt: new Date().toISOString(),
      overallScore: sessionFeedback.overall_score,
      communicationScore: sessionFeedback.communication_score,
      contentScore: sessionFeedback.content_score,
      confidenceScore: sessionFeedback.confidence_score,
      strengths: [] as string[],
      weaknesses: [] as string[],
      suggestions: [sessionFeedback.improvement_plan],
      transcriptPreview: turns[0]?.transcript?.slice(0, 200) ?? "",
      turnFeedbacks,
    };

    return Response.json({ result_id: sessionId, local_mode: true, result });
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

    const sessionMeta = session.config?.session_meta ?? {};
    const dbRoleName: string = sessionMeta.roleName ?? roleName ?? "Unknown";
    const dbExperienceLevelName: string = sessionMeta.experienceLevelName ?? experienceLevelName ?? "Unknown";
    const lang = session.language_code ?? languageCode ?? "vi";

    // Use client-supplied turns if provided, otherwise load from DB
    let turnList = turns;
    if (turnList.length === 0) {
      const { data: answers } = await supabase
        .from("interview_answers")
        .select("answer_index, prompt_text, transcript, duration_seconds")
        .eq("session_id", sessionId)
        .not("transcript", "is", null)
        .order("answer_index", { ascending: true });

      turnList = (answers ?? []).map(
        (a: { prompt_text: string | null; transcript: string | null; duration_seconds: number | null }) => ({
          question: a.prompt_text ?? "",
          transcript: a.transcript ?? "",
          duration_seconds: a.duration_seconds ?? 0,
        })
      );
    }

    const { sessionFeedback, turnFeedbacks } = await runAllFeedback(
      dbRoleName,
      dbExperienceLevelName,
      lang,
      turnList
    );

    await supabase.from("interview_session_feedback").upsert({
      session_id: sessionId,
      overall_score: sessionFeedback.overall_score,
      communication_score: sessionFeedback.communication_score,
      content_score: sessionFeedback.content_score,
      confidence_score: sessionFeedback.confidence_score,
      summary: sessionFeedback.summary,
      improvement_plan: sessionFeedback.improvement_plan,
      raw_ai_json: {
        session: sessionFeedback.raw_ai_json,
        turns: turnFeedbacks,
      },
    });

    await supabase
      .from("interview_sessions_v2")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    return Response.json({
      result_id: sessionId,
      local_mode: false,
      turn_feedbacks: turnFeedbacks,
    });
  } catch (error) {
    console.error("POST /api/interview/live/[id]/complete:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    return Response.json({ error: "COMPLETE_FAILED" }, { status: 500 });
  }
}
