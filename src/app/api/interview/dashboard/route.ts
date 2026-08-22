import { NextResponse } from "next/server";
import { requireInterviewUser } from "../_lib/auth";
import { createInterviewSupabaseClient } from "../_lib/supabase";
import {
  getFallbackExperienceName,
  getFallbackRoleName,
  normalizeVietnameseInterviewLabel,
} from "../_lib/data";

export async function GET() {
  try {
    const user = await requireInterviewUser();
    const supabase = createInterviewSupabaseClient();

    // KHÔNG embed interview_roles/interview_experience_levels/interview_session_feedback
    // trực tiếp trong .select() của interview_sessions_v2 — đã xác minh bằng
    // query thật trên DB rằng interview_experience_levels và interview_session_feedback
    // KHÔNG có foreign key constraint mà PostgREST nhận diện được (lỗi PGRST200
    // "Could not find a relationship..."), nên bất kỳ request nào dùng các
    // embed này đều 500 100% thời gian, không phụ thuộc dữ liệu của user.
    // Vai trò/kinh nghiệm resolve từ config.session_meta + fallback (giống
    // GET /session/[id]); feedback lấy bằng query riêng rồi map thủ công theo
    // session_id.
    const [{ count, error: countError }, { data: sessions, error: sessionsError }] =
      await Promise.all([
        supabase
          .from("interview_sessions_v2")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("interview_sessions_v2")
          .select("id, module_type, status, started_at, role_id, experience_level_id, config")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(5),
      ]);

    if (countError) throw countError;
    if (sessionsError) throw sessionsError;

    const rows = sessions ?? [];
    const sessionIds = rows.map((session) => session.id);

    const feedbackBySessionId = new Map<
      string,
      { overall_score: number | null; summary: string | null; improvement_plan: string | null }
    >();

    if (sessionIds.length > 0) {
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from("interview_session_feedback")
        .select("session_id, overall_score, summary, improvement_plan")
        .in("session_id", sessionIds);

      // Feedback là dữ liệu bổ sung (chart/insight) — nếu query này lỗi thì
      // vẫn phải trả được stats + history cốt lõi, không kéo sập cả Dashboard.
      if (feedbackError) {
        console.error("GET /api/interview/dashboard feedback query failed:", feedbackError);
      } else {
        for (const row of feedbackRows ?? []) {
          feedbackBySessionId.set(row.session_id, row);
        }
      }
    }

    const completedScores = rows
      .map((session) => Number(feedbackBySessionId.get(session.id)?.overall_score ?? 0))
      .filter((score) => score > 0);
    const averageScore = completedScores.length
      ? Math.round(completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length)
      : 0;
    const processingCount = rows.filter((session) => session.status === "processing").length;

    // Xu hướng: chỉ tính khi có ít nhất 2 buổi đã có điểm — so 2 buổi gần nhất,
    // không suy diễn/giả lập khi chưa đủ dữ liệu.
    const trendValue = completedScores.length > 1 ? completedScores[0] - completedScores[1] : null;

    // completedScores giữ đúng thứ tự gần→xa của rows (rows đã order by
    // started_at desc) nên phần tử đầu chính là điểm của buổi hoàn tất gần
    // nhất — dùng làm stat "Điểm gần nhất" khi không có buổi nào đang xử lý.
    const latestScore = completedScores.length ? completedScores[0] : null;

    const recentSessions = rows.map((session) => {
      const sessionMeta = (session.config as { session_meta?: { roleName?: string; experienceLevelName?: string } } | null)
        ?.session_meta;
      const roleName = normalizeVietnameseInterviewLabel(
        sessionMeta?.roleName ?? getFallbackRoleName(session.role_id ?? undefined)
      );
      const levelName = normalizeVietnameseInterviewLabel(
        sessionMeta?.experienceLevelName ?? getFallbackExperienceName(session.experience_level_id ?? undefined)
      );
      const feedback = feedbackBySessionId.get(session.id);

      return {
        id: session.id,
        title: roleName || "Buổi phỏng vấn",
        moduleId: `module-${session.module_type}`,
        role: roleName || "Chưa xác định",
        level: levelName || "Chưa xác định",
        score: Number(feedback?.overall_score ?? 0),
        status: session.status,
        createdAt: session.started_at,
      };
    });

    // Nhận định: lấy trực tiếp từ feedback thật của buổi gần nhất đã có kết
    // quả — không tổng hợp giả định, không mock. Nếu không có insight, mảng
    // rỗng — không được phép làm cả Dashboard fail.
    const latestSessionWithFeedback = rows.find((session) => feedbackBySessionId.get(session.id)?.summary);
    const latestFeedback = latestSessionWithFeedback
      ? feedbackBySessionId.get(latestSessionWithFeedback.id)
      : null;
    const insights = latestFeedback
      ? [
          { title: "Tổng kết buổi gần nhất", text: latestFeedback.summary as string },
          ...(latestFeedback.improvement_plan
            ? [{ title: "Gợi ý cải thiện", text: latestFeedback.improvement_plan }]
            : []),
        ]
      : [];

    return NextResponse.json({
      stats: [
        { label: "Tổng lần thực hành", value: String(count ?? 0), hint: "Tất cả các module" },
        {
          label: "Điểm trung bình",
          value: averageScore ? `${averageScore}/100` : "Chưa có",
          hint: `${completedScores.length} buổi gần nhất`,
        },
        // "Đang xử lý" chỉ hữu ích khi thật sự có buổi đang chờ AI phân tích —
        // nếu không, hiển thị điểm gần nhất sẽ có giá trị hơn là một số 0 cố định.
        processingCount > 0
          ? { label: "Đang xử lý", value: String(processingCount), hint: "Đang chờ AI phân tích" }
          : {
              label: "Điểm gần nhất",
              value: latestScore !== null ? `${latestScore}/100` : "Chưa có",
              hint: "Buổi gần nhất",
            },
        {
          label: "Xu hướng",
          value: trendValue === null ? "Chưa đủ dữ liệu" : `${trendValue >= 0 ? "+" : ""}${trendValue} điểm`,
          hint: trendValue === null ? "Cần ít nhất 2 buổi để so sánh" : "So với buổi trước đó",
        },
      ],
      recentSessions,
      insights,
    });
  } catch (error) {
    console.error("GET /api/interview/dashboard:", error);
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    return NextResponse.json({ error: "DASHBOARD_LOAD_FAILED" }, { status: 500 });
  }
}
