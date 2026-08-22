import { NextResponse } from "next/server";
import { requireInterviewUser } from "@/app/api/interview/_lib/auth";
import { createInterviewSupabaseClient } from "@/app/api/interview/_lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .select("id, module_type, config")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      throw sessionError ?? new Error("RESULT_NOT_FOUND");
    }

    const { data: answers } = await supabase
      .from("interview_answers")
      .select("id, prompt_text, transcript")
      .eq("session_id", id)
      .not("id", "is", null)
      .order("answer_index", { ascending: true });

    const answerIds = (answers ?? []).map((answer) => answer.id).filter(Boolean);
    const { data: answerFeedback } = answerIds.length
      ? await supabase
          .from("interview_answer_feedback")
          .select("answer_id, strengths, weaknesses, tips")
          .in("answer_id", answerIds)
      : { data: [] };
    const firstFeedback = (answerFeedback?.[0] ?? {}) as {
      strengths?: string[];
      weaknesses?: string[];
      tips?: string[];
    };
    const transcriptPreview =
      answers?.map((answer: any) => answer.transcript).filter(Boolean).join("\n\n") ?? "";
    const { data: sessionFeedbackRows } = await supabase
      .from("interview_session_feedback")
      .select("overall_score, communication_score, content_score, confidence_score, summary, improvement_plan")
      .eq("session_id", id)
      .limit(1);
    const sessionFeedback = (sessionFeedbackRows?.[0] ?? {}) as {
      overall_score?: number | string | null;
      communication_score?: number | string | null;
      content_score?: number | string | null;
      confidence_score?: number | string | null;
      improvement_plan?: string | null;
    };
    const sessionMeta = session.config?.session_meta ?? {};

    return NextResponse.json({
      id,
      moduleId: `module-${session.module_type}`,
      role: sessionMeta.roleName ?? "Chưa xác định",
      level: sessionMeta.experienceLevelName ?? "Chưa xác định",
      overallScore: Number(sessionFeedback.overall_score ?? 0),
      communicationScore: Number(sessionFeedback.communication_score ?? 0),
      contentScore: Number(sessionFeedback.content_score ?? 0),
      confidenceScore: Number(sessionFeedback.confidence_score ?? 0),
      strengths: firstFeedback.strengths ?? [],
      weaknesses: firstFeedback.weaknesses ?? [],
      suggestions: firstFeedback.tips ?? [sessionFeedback.improvement_plan ?? ""].filter(Boolean),
      transcriptPreview,
    });
  } catch (error) {
    console.error("GET /api/interview/results/[id]:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "RESULT_NOT_FOUND") {
      return NextResponse.json({ error: "RESULT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ error: "RESULT_LOAD_FAILED" }, { status: 500 });
  }
}
