// src/lib/career/analyseKnowdell.ts
import OpenAI from "openai";          // hoặc client bạn đang dùng

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ------------------------------------------------------------------ */
/* 1. Tạo prompt chỉ dùng Holland + Knowdell interests                 */
/* ------------------------------------------------------------------ */
function buildPrompt(profile: any) {
  // ── Holland: { "A":27,"C":31,"E":33,"I":22,"R":30,"S":27 }
  const hollandObj = profile.holland_profile ?? {};
  const hollandStr = Object.entries(hollandObj)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  // ── Interests: [{interest_key:"Police Officer", …}, …]
  const interests =
    profile.knowdell?.interests?.map((i: any) => i.interest_key) ?? [];

  return `
Bạn là cố vấn nghề nghiệp. Phân tích mức độ phù hợp của ứng viên **chỉ dựa trên**:

- Kết quả **Holland** (điểm % mỗi nhóm): ${hollandStr || "chưa có"}
- Danh sách **sở thích nghề (Knowdell)**: ${
    interests.length ? interests.join(", ") : "chưa có"
  }

Trả lời bằng **Markdown tiếng Việt**,:
1. **Đưa ra 05 ngành nghề phù hợp dựa trên danh sách nghề nghiệp mà người dùng đã chọn.
2. **Định hướng phát triển** – gợi ý học tập/chứng chỉ/hoạt động nên làm.
`;
}

/* ------------------------------------------------------------------ */
/* 2. Hàm gọi GPT & trả về markdown                                   */
/* ------------------------------------------------------------------ */
export async function analyseKnowdell(profile: any): Promise<string> {
  const prompt = buildPrompt(profile);

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",                 // model bạn đang dùng
    temperature: 0.7,
    messages: [
      { role: "system", content: "Bạn là chuyên gia hướng nghiệp." },
      { role: "user",   content: prompt },
    ],
  });

  return chat.choices[0].message.content.trim();
}
