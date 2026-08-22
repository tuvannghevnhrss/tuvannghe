import { requireInterviewUser } from "../../_lib/auth";
import { canUseModule, DB_MODULE_TYPE } from "../../_lib/access";
import { createInterviewSupabaseClient } from "../../_lib/supabase";

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

const INTERVIEW_TYPE_LABEL: Record<string, string> = {
  behavioral: "hành vi (câu hỏi STAR)",
  technical: "kỹ thuật chuyên môn",
  mixed: "kết hợp hành vi và kỹ thuật",
};

function buildInstructions(params: {
  roleName: string;
  experienceLevelName: string;
  interviewType: string;
  languageCode: string;
  jobTitle?: string;
  jobDescription?: string;
  candidateSummary?: string;
}): string {
  const lang = params.languageCode.startsWith("vi") ? "tiếng Việt" : "English";
  const position = params.jobTitle || params.roleName;
  const typeLabel =
    INTERVIEW_TYPE_LABEL[params.interviewType] ?? params.interviewType;

  const lines = [
    `Bạn là Alex — nhà tuyển dụng chuyên nghiệp, đang phỏng vấn ứng viên cho vị trí ${position}.`,
    `Phong cách: thân thiện, chuyên nghiệp, tự nhiên. Sử dụng ${lang}.`,
    `Cấp bậc ứng viên: ${params.experienceLevelName}.`,
    `Loại phỏng vấn: ${typeLabel}.`,
    params.jobDescription
      ? `\nMô tả công việc:\n${params.jobDescription}`
      : "",
    params.candidateSummary
      ? `\nTóm tắt CV ứng viên:\n${params.candidateSummary}`
      : "",
    `\nQuy trình buổi phỏng vấn:`,
    `1. Tự giới thiệu ngắn (tên Alex, vai trò phỏng vấn viên) và mời ứng viên giới thiệu bản thân.`,
    `2. Đặt 5–7 câu hỏi phù hợp với loại ${typeLabel} và cấp bậc ${params.experienceLevelName}.`,
    `3. Hỏi sâu (follow-up) tự nhiên dựa trên câu trả lời của ứng viên.`,
    `4. Sau 6–8 lượt, kết thúc: cảm ơn ứng viên và thông báo các bước tiếp theo.`,
    `\nLưu ý quan trọng:`,
    `- Nếu ứng viên ngắt lời, dừng ngay và lắng nghe tự nhiên.`,
    `- Mỗi câu hỏi tối đa 2 câu, ngắn gọn, không đọc như danh sách.`,
    `- Phản ứng tự nhiên với câu trả lời, dẫn dắt cuộc trò chuyện linh hoạt.`,
    `- Bắt đầu ngay khi kết nối được thiết lập, không chờ.`,
  ];

  return lines.filter(Boolean).join("\n");
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_KEY_MISSING" }, { status: 500 });
  }

  /* ── Access control: require auth + Module 3 quota ─────────────────────── */
  let userId: string;
  try {
    const user = await requireInterviewUser();
    userId = user.id;
  } catch {
    return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const allowed = await canUseModule(userId, "module3");
  if (!allowed) {
    return Response.json({ error: "QUOTA_EXCEEDED", message: "Bạn đã dùng hết lượt Module 3. Nâng cấp gói để tiếp tục." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, string>;

  const roleName = body.role_name ?? "Nhà tuyển dụng";
  const experienceLevelName = body.experience_level_name ?? "Trung cấp";
  const interviewType = body.interview_type ?? "mixed";
  const voice = ["shimmer", "nova", "alloy"].includes(body.voice)
    ? body.voice
    : "shimmer";
  const languageCode = body.language_code ?? "vi";
  const jobTitle = body.job_title || undefined;
  const jobDescription = body.job_description || undefined;
  const candidateSummary = body.candidate_summary || undefined;

  const instructions = buildInstructions({
    roleName,
    experienceLevelName,
    interviewType,
    languageCode,
    jobTitle,
    jobDescription,
    candidateSummary,
  });

  try {
    const sessionRes = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: REALTIME_MODEL,
          voice,
          instructions,
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 600,
          },
          input_audio_transcription: {
            model: "whisper-1",
          },
        }),
      }
    );

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error("OpenAI Realtime session error:", errText);
      return Response.json({ error: "SESSION_CREATE_FAILED" }, { status: 502 });
    }

    const session = await sessionRes.json() as {
      client_secret?: { value?: string };
    };
    const ephemeralKey = session.client_secret?.value;

    if (!ephemeralKey) {
      return Response.json({ error: "NO_EPHEMERAL_KEY" }, { status: 502 });
    }

    const sessionId = `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    /* ── Track usage in DB (module_type 2 = Module 3 realtime) ─────────── */
    const supabase = createInterviewSupabaseClient();
    await supabase.from("interview_sessions_v2").insert({
      user_id: userId,
      module_type: DB_MODULE_TYPE.module3,
      status: "draft",
      language_code: body.language_code ?? "vi",
      config: { realtime: true, sessionId },
    }).then(({ error }) => {
      if (error) console.error("Module 3 usage tracking failed:", error.message);
    });

    return Response.json({ session_id: sessionId, ephemeral_key: ephemeralKey });
  } catch (err) {
    console.error("POST /api/interview/module-3/session:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
