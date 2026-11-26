import { M3_MODELS } from "@/lib/m3/config";
import { realtimeInstructions } from "@/lib/m3/persona";
import { HttpError, authed, errorResponse, json, loadInterview } from "@/lib/m3/server";

export const runtime = "nodejs";

/**
 * Cấp ephemeral key (client secret) cho OpenAI Realtime GA.
 * - API key thật KHÔNG bao giờ gửi xuống trình duyệt.
 * - Lớp giọng nói chỉ nhận chỉ dẫn "đọc nguyên văn"; mọi câu hỏi do Orchestrator quyết định.
 * - create_response=false: model không tự trả lời khi ứng viên nói xong.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    const it = await loadInterview(db, user.id, id);
    if (it.row.status !== "in_progress") throw new HttpError(409, "NOT_IN_PROGRESS", "Buổi phỏng vấn chưa bắt đầu hoặc đã kết thúc.");
    if (!process.env.OPENAI_API_KEY) throw new HttpError(500, "OPENAI_KEY_MISSING", "Máy chủ chưa cấu hình OpenAI.");

    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: M3_MODELS.realtime,
          instructions: realtimeInstructions(it.config),
          output_modalities: ["audio"],
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              transcription: { model: M3_MODELS.transcribe, language: it.config.language },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 900,
                create_response: false,
                interrupt_response: true,
              },
            },
            output: { voice: it.config.voice },
          },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[m3] realtime client_secret failed:", res.status, text.slice(0, 300));
      throw new HttpError(502, "REALTIME_UNAVAILABLE", "Không khởi tạo được phiên giọng nói. Bạn có thể dùng chế độ dự phòng.");
    }
    const data = (await res.json()) as { value?: string; client_secret?: { value?: string } };
    const secret = data.value ?? data.client_secret?.value;
    if (!secret) throw new HttpError(502, "REALTIME_UNAVAILABLE", "Không nhận được khóa phiên giọng nói.");
    return json({ client_secret: secret, model: M3_MODELS.realtime });
  } catch (err) {
    return errorResponse(err);
  }
}
