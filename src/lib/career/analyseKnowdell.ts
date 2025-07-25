import OpenAI from "openai";

/* ------------------------------------------------------------------ *
 *  Hàm gọi GPT và trả về bản phân tích (Markdown, tiếng Việt)
 * ------------------------------------------------------------------ */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,          // <-- bắt buộc
});

/** Phân tích Knowdell + MBTI + Holland + skills / values   */
export async function analyseKnowdell(profile: {
  mbti?: string;
  holland?: string;
  values?: string[];
  skills?: { key: string; love: number; pro: number }[];
}) {
  /* ----- Ghép nội dung người-dùng --------------------------------------- */
  const prompt = `
Bạn là cố vấn nghề nghiệp. Phân tích mức độ phù hợp của ứng viên dựa trên:
- MBTI: ${profile.mbti ?? "chưa có"}
- Holland: ${profile.holland ?? "chưa có"}
- Giá trị (Knowdell): ${profile.values?.join(", ") ?? "chưa có"}
- Kỹ năng yêu thích: ${
    profile.skills?.map((s) => s.key).join(", ") ?? "chưa có"
  }

Trả lời bằng **Markdown tiếng Việt**, chia 4 mục:
1. **Tóm tắt**
2. **Điểm mạnh**
3. **Điểm cần cải thiện**
4. **Định hướng phát triển**
`;

  /* ----- Gọi GPT -------------------------------------------------------- */
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",          // hoặc gpt-3.5-turbo, gpt-4o … tuỳ tài khoản
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "Bạn là chuyên gia tư vấn nghề nghiệp, trả lời ngắn gọn, súc tích.",
      },
      { role: "user", content: prompt },
    ],
  });

  /* ----- Lấy nội dung trả về ------------------------------------------- */
  return res.choices[0].message.content?.trim() ?? "";
}
