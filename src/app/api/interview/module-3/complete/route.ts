import { createSessionFeedback } from "../../_lib/ai";

type TranscriptEntry = { role: "ai" | "user"; text: string };

function parseTranscriptToAnswers(transcript: TranscriptEntry[]) {
  const answers: Array<{ question: string; transcript: string; score: null }> = [];
  let pendingQuestion = "";

  for (const entry of transcript) {
    if (entry.role === "ai" && entry.text?.trim()) {
      pendingQuestion = entry.text.trim();
    } else if (entry.role === "user" && entry.text?.trim() && pendingQuestion) {
      answers.push({
        question: pendingQuestion,
        transcript: entry.text.trim(),
        score: null,
      });
      pendingQuestion = "";
    }
  }

  return answers;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const sessionId = String(body.session_id ?? `rt-${Date.now()}`);
  const transcript = Array.isArray(body.transcript)
    ? (body.transcript as TranscriptEntry[])
    : [];
  const roleName = String(body.role_name ?? "Unknown");
  const experienceLevelName = String(body.experience_level_name ?? "Unknown");
  const languageCode = String(body.language_code ?? "vi");

  const answers = parseTranscriptToAnswers(transcript);

  if (answers.length === 0) {
    return Response.json({ error: "NO_ANSWERS" }, { status: 400 });
  }

  const feedback = await createSessionFeedback({
    roleName,
    experienceLevelName,
    languageCode,
    answers,
  });

  const firstUserText =
    transcript.find((e) => e.role === "user")?.text ?? "";

  const result = {
    id: sessionId,
    moduleId: "module-3" as const,
    role: roleName,
    level: experienceLevelName,
    createdAt: new Date().toISOString(),
    overallScore: feedback.overall_score,
    communicationScore: feedback.communication_score,
    contentScore: feedback.content_score,
    confidenceScore: feedback.confidence_score,
    strengths: [] as string[],
    weaknesses: [] as string[],
    suggestions: [feedback.improvement_plan],
    transcriptPreview: firstUserText.slice(0, 200),
  };

  return Response.json({ session_id: sessionId, result });
}
