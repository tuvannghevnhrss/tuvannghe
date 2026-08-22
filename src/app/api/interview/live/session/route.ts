import { requireInterviewUser } from "../../_lib/auth";
import { canUseModule } from "../../_lib/access";
import { createInterviewSupabaseClient } from "../../_lib/supabase";
import { generateLiveQuestion, generateTTSAudio } from "../../_lib/ai";
import { fallbackRoles, fallbackExperienceLevels, normalizeVietnameseInterviewLabel } from "../../_lib/data";

const DEFAULT_TOTAL_TURNS = 6;
const VALID_VOICES = ["alloy", "nova", "shimmer"] as const;
const VALID_INTERVIEW_TYPES = ["behavioral", "technical", "mixed"] as const;

type Voice = (typeof VALID_VOICES)[number];
type InterviewType = (typeof VALID_INTERVIEW_TYPES)[number];

function localSessionId() {
  return `local-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Accept string (UUID) or number IDs — never force Number() conversion
  const roleId = body?.role_id ?? null;
  const experienceLevelId = body?.experience_level_id ?? null;
  const jobTitle = String(body?.job_title ?? "").trim() || null;
  const languageCode = String(body?.language_code ?? "vi").trim();
  const interviewType: InterviewType = VALID_INTERVIEW_TYPES.includes(body?.interview_type)
    ? (body.interview_type as InterviewType)
    : "mixed";
  const voice: Voice = VALID_VOICES.includes(body?.voice)
    ? (body.voice as Voice)
    : "shimmer";
  const totalTurns = DEFAULT_TOTAL_TURNS;

  // ── Resolve names passed from frontend ──────────────────────────────────
  // Frontend now sends roleName + experienceLevelName directly in body
  const roleName = normalizeVietnameseInterviewLabel(
    String(body?.role_name ?? "").trim() ||
    fallbackRoles.find((r) => String(r.id) === String(roleId))?.name ||
    "Unknown"
  );
  const experienceLevelName = normalizeVietnameseInterviewLabel(
    String(body?.experience_level_name ?? "").trim() ||
    fallbackExperienceLevels.find((e) => String(e.id) === String(experienceLevelId))?.name ||
    "Unknown"
  );

  // ── Attempt auth — fall back to local mode if not logged in ─────────────
  let userId: string | null = null;
  try {
    const user = await requireInterviewUser();
    userId = user.id;
  } catch {
    // Not logged in → local mode
  }

  // ── Access control (only when authenticated) ─────────────────────────────
  if (userId) {
    const allowed = await canUseModule(userId, "module2");
    if (!allowed) {
      return Response.json(
        { error: "QUOTA_EXCEEDED", message: "Bạn đã dùng hết lượt Module 2. Nâng cấp gói để tiếp tục." },
        { status: 403 }
      );
    }
  }

  // ── Generate opener + TTS ────────────────────────────────────────────────
  const { question: openerQuestion } = await generateLiveQuestion({
    roleName,
    experienceLevelName,
    jobTitle: jobTitle ?? undefined,
    jobDescription: body?.job_description ?? undefined,
    interviewType,
    conversationHistory: [],
    turnNumber: 1,
    totalTurns,
    languageCode,
  });

  const audioBuffer = await generateTTSAudio(openerQuestion, voice);

  const turnPayload = {
    order: 0,
    question: openerQuestion,
    audio_base64: audioBuffer ? audioBuffer.toString("base64") : null,
    audio_mime: "audio/mpeg",
  };

  const sessionMetaConfig = {
    roleName,
    experienceLevelName,
    roleId,
    experienceLevelId,
  };

  // ── Local mode: skip DB ──────────────────────────────────────────────────
  if (!userId) {
    return Response.json({
      session_id: localSessionId(),
      local_mode: true,
      turn: turnPayload,
      total_turns: totalTurns,
      meta: { roleName, experienceLevelName, interviewType, voice, totalTurns, languageCode },
    });
  }

  // ── Authenticated mode: write to DB ─────────────────────────────────────
  try {
    const supabase = createInterviewSupabaseClient();

    // Ensure profiles row exists (interview_sessions_v2.user_id FK references profiles)
    await supabase.from("profiles").upsert({ user_id: userId }, { onConflict: "user_id" });

    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions_v2")
      .insert({
        user_id: userId,
        module_type: 3,
        role_id: null,
        difficulty_level_id: null,
        experience_level_id: null,
        job_title: jobTitle,
        language_code: languageCode,
        status: "draft",
        config: {
          session_meta: sessionMetaConfig,
          totalTurns,
          interviewType,
          voice,
          jobDescription: body?.job_description ?? null,
          candidateSummary: body?.candidate_summary ?? null,
        },
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw sessionError ?? new Error("SESSION_CREATE_FAILED");
    }

    await supabase.from("interview_answers").insert({
      id: crypto.randomUUID(),
      session_id: session.id,
      answer_index: 0,
      prompt_text: openerQuestion,
    });

    return Response.json({
      session_id: session.id,
      local_mode: false,
      turn: turnPayload,
      total_turns: totalTurns,
    });
  } catch (error) {
    console.error("POST /api/interview/live/session DB error:", error);
    // Fallback to local mode rather than hard error
    return Response.json({
      session_id: localSessionId(),
      local_mode: true,
      turn: turnPayload,
      total_turns: totalTurns,
      meta: { roleName, experienceLevelName, interviewType, voice, totalTurns, languageCode },
    });
  }
}
