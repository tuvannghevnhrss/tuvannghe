import { createFallbackSessionId } from "../_lib/data";
import { requireInterviewUser } from "../_lib/auth";
import { canUseModule } from "../_lib/access";
import { createInterviewSupabaseClient } from "../_lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const moduleType = Number(body?.module_type) || 1;
  const roleId = body?.role_id ?? null;
  const difficultyLevelId = body?.difficulty_level_id ?? null;
  const experienceLevelId = body?.experience_level_id ?? null;
  const config = body?.config ?? {};
  let userId: string | null = null;

  try {
    const user = await requireInterviewUser();
    userId = user.id;

    /* ── Access control ─────────────────────────────────────────────────── */
    const allowed = await canUseModule(userId, "module1");
    if (!allowed) {
      return Response.json(
        { error: "QUOTA_EXCEEDED", message: "Bạn đã dùng hết lượt Module 1. Nâng cấp gói để tiếp tục." },
        { status: 403 }
      );
    }
    const supabase = createInterviewSupabaseClient();

    // Ensure user has a profiles row (interview_sessions_v2.user_id FK references profiles)
    await supabase.from("profiles").upsert({ user_id: user.id }, { onConflict: "user_id" });

    const { data, error } = await supabase
      .from("interview_sessions_v2")
      .insert([
        {
          user_id: user.id,
          module_type: moduleType,
          role_id: roleId,
          difficulty_level_id: difficultyLevelId,
          experience_level_id: experienceLevelId,
          job_title: body?.job_title ?? null,
          language_code: body?.language_code ?? "vi",
          config,
          status: "draft",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ session_id: data.id });
  } catch (err) {
    console.error("POST /api/interview/session fallback:", err);
    return Response.json({
      local_mode: true,
      user_id: userId,
      session_id: createFallbackSessionId(roleId, difficultyLevelId, experienceLevelId),
    });
  }
}
