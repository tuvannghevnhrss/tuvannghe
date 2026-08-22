import { NextResponse } from "next/server";
import { requireInterviewUser } from "../_lib/auth";
import { createInterviewSupabaseClient } from "../_lib/supabase";

export async function GET() {
  try {
    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();
    const { data, error } = await supabase
      .from("interview_sessions_v2")
      .select(
        `
        id,
        module_type,
        started_at,
        status,
        interview_roles(name),
        interview_experience_levels(name),
        interview_session_feedback(overall_score, summary)
      `
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      (data ?? []).map((item: any) => ({
        id: item.id,
        moduleId: `module-${item.module_type}`,
        role: item.interview_roles?.name ?? "Chưa xác định",
        level: item.interview_experience_levels?.name ?? "Chưa xác định",
        score: Number(item.interview_session_feedback?.[0]?.overall_score ?? 0),
        createdAt: item.started_at,
        summary:
          item.interview_session_feedback?.[0]?.summary ?? "Đang chờ AI tổng hợp phản hồi.",
        status: item.status,
      }))
    );
  } catch (error) {
    console.error("GET /api/interview/history:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    return NextResponse.json({ error: "HISTORY_LOAD_FAILED" }, { status: 500 });
  }
}
