import {
  fallbackDifficultyLevels,
  fallbackExperienceLevels,
  fallbackRoles,
} from "../../_lib/data";
import { createInterviewSupabaseClient } from "../../_lib/supabase";

export async function GET() {
  try {
    const supabase = createInterviewSupabaseClient();
    const [rolesRes, difficultiesRes, experiencesRes] = await Promise.all([
      supabase.from("interview_roles").select("*").order("id"),
      supabase.from("interview_difficulty_levels").select("*").order("id"),
      supabase.from("interview_experience_levels").select("*").order("id"),
    ]);

    if (rolesRes.error) throw rolesRes.error;
    if (difficultiesRes.error) throw difficultiesRes.error;
    if (experiencesRes.error) throw experiencesRes.error;

    return Response.json({
      roles: rolesRes.data ?? [],
      difficulties: difficultiesRes.data ?? [],
      experienceLevels: experiencesRes.data ?? [],
    });
  } catch (error) {
    console.error("GET /api/interview/module-1/options fallback:", error);
    return Response.json({
      roles: fallbackRoles,
      difficulties: fallbackDifficultyLevels,
      experienceLevels: fallbackExperienceLevels,
    });
  }
}
