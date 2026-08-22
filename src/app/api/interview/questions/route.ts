import { fallbackQuestions } from "../_lib/data";
import { createInterviewSupabaseClient } from "../_lib/supabase";

export async function GET() {
  try {
    const supabase = createInterviewSupabaseClient();

    const { data, error } = await supabase
      .from("interview_questions")
      .select(`
        id,
        content,
        category,
        role_id,
        difficulty_level_id,
        experience_level_id,
        interview_roles(name),
        interview_difficulty_levels(name),
        interview_experience_levels(name)
      `);

    if (error) {
      throw error;
    }

    return Response.json(data ?? []);
  } catch (error) {
    console.error("GET /api/interview/questions fallback:", error);
    return Response.json(fallbackQuestions);
  }
}
