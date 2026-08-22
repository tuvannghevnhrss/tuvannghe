import {
  getFallbackDifficultyName,
  getFallbackExperienceName,
  getFallbackRoleName,
  getFallbackQuestions,
  isLocalInterviewSessionId,
  normalizeVietnameseInterviewLabel,
  parseFallbackSessionId,
} from "../../_lib/data";
import { requireInterviewUser } from "../../_lib/auth";
import { createInterviewSupabaseClient } from "../../_lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id: sessionId } = await params;

  // Session "local-*" là session tạo tạm khi backend lỗi lúc khởi tạo (xem
  // POST /api/interview/session) — không có hàng thật trong DB, nên hiển thị
  // luôn dữ liệu giả lập thay vì tra DB.
  if (isLocalInterviewSessionId(sessionId)) {
    const parsed = parseFallbackSessionId(sessionId);
    const roleId = parsed?.roleId ?? 1;
    const difficultyLevelId = parsed?.difficultyLevelId ?? 2;
    const experienceLevelId = parsed?.experienceLevelId ?? 3;

    return Response.json({
      session: {
        id: sessionId,
        role_id: roleId,
        difficulty_level_id: difficultyLevelId,
        experience_level_id: experienceLevelId,
        module_type: 1,
        user_id: "local-user",
        config: {},
        interview_roles: { name: getFallbackRoleName(roleId) },
        interview_difficulty_levels: { name: getFallbackDifficultyName(difficultyLevelId) },
        interview_experience_levels: { name: getFallbackExperienceName(experienceLevelId) },
      },
      question_source: "fallback_bank",
      questions: getFallbackQuestions(roleId, difficultyLevelId, experienceLevelId).slice(0, 10),
    });
  }

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
      console.error("GET /api/interview/session/[id] not found:", sessionError);
      return Response.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const sessionMeta = session.config?.session_meta ?? null;
    const roleName = normalizeVietnameseInterviewLabel(
      sessionMeta?.roleName ?? getFallbackRoleName(session.role_id)
    );
    const difficultyName = normalizeVietnameseInterviewLabel(
      sessionMeta?.difficultyName ?? getFallbackDifficultyName(session.difficulty_level_id)
    );
    const experienceLevelName = normalizeVietnameseInterviewLabel(
      sessionMeta?.experienceLevelName ?? getFallbackExperienceName(session.experience_level_id)
    );

    // Inject resolved names back so the client can display them
    const enrichedSession = {
      ...session,
      interview_roles: { name: roleName },
      interview_difficulty_levels: { name: difficultyName },
      interview_experience_levels: { name: experienceLevelName },
    };

    const canonicalRoleId = sessionMeta?.roleId ?? 1;
    const canonicalDifficultyId = sessionMeta?.difficultyLevelId ?? 2;
    const canonicalExperienceId = sessionMeta?.experienceLevelId ?? 3;

    // Only query DB for questions if we have real FK IDs to filter on
    let dbQuestions: Array<Record<string, unknown>> | null = null;
    if (session.role_id != null && session.difficulty_level_id != null) {
      const { data } = await supabase
        .from("interview_questions")
        .select("*")
        .eq("role_id", session.role_id)
        .eq("difficulty_level_id", session.difficulty_level_id)
        .limit(10);
      dbQuestions = data ?? null;
    }

    return Response.json({
      session: enrichedSession,
      question_source: dbQuestions?.length ? "bank" : "fallback_bank",
      questions: dbQuestions?.length
        ? dbQuestions
        : getFallbackQuestions(canonicalRoleId, canonicalDifficultyId, canonicalExperienceId).slice(0, 10),
    });
  } catch (error) {
    // Lỗi thật (chưa đăng nhập, DB lỗi...) cho một session_id KHÔNG PHẢI local
    // phải báo lỗi rõ ràng — trước đây bị âm thầm trả về session giả, khiến
    // user ghi âm xong xuôi rồi mới biết session không tồn tại lúc phân tích.
    console.error("GET /api/interview/session/[id] failed:", error);
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "AUTH_REQUIRED" ? 401 : 500;
    return Response.json({ error: "SESSION_LOAD_FAILED", message }, { status });
  }
}
