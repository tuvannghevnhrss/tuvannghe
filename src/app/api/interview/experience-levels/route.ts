import { fallbackExperienceLevels } from "../_lib/data";
import { createInterviewSupabaseClient } from "../_lib/supabase";

export async function GET() {
  try {
    const supabase = createInterviewSupabaseClient();
    const { data, error } = await supabase
      .from("interview_experience_levels")
      .select("*")
      .order("id");

    if (error) {
      throw error;
    }

    return Response.json(data ?? []);
  } catch (err) {
    console.error("GET /api/interview/experience-levels fallback:", err);
    return Response.json(fallbackExperienceLevels);
  }
}
