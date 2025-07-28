// -----------------------------------------------------------------------------
// src/lib/career/analyseKnowdell.ts
// -----------------------------------------------------------------------------
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------------------------------------------------ */
/* 1. Tạo prompt – chỉ dùng Holland + Knowdell interests              */
/* ------------------------------------------------------------------ */
function buildPrompt(profile: any) {
  // Holland: { "A":27,"C":31,"E":33,"I":22,"R":30,"S":27 }
  const hollandObj = profile.holland_profile ?? {};
  const hollandStr = Object.entries(hollandObj)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');

  // Interests: [{interest_key:"Police Officer", …}, …]
  const interests =
    profile.knowdell?.interests?.map((i: any) => i.interest_key) ?? [];

  return `
Bạn là cố vấn nghề nghiệp. Phân tích mức độ phù hợp của ứng viên **chỉ dựa trên**:

- Kết quả **Holland** (điểm % mỗi nhóm): ${hollandStr || 'chưa có'}
- Danh sách **sở thích nghề (Knowdell)**: ${
    interests.length ? interests.join(', ') : 'chưa có'
  }

Yêu cầu:
1. **Liệt kê đúng 05 ngành nghề phù hợp** (dựa trên Holland & sở thích)  
   ➜ *Tên ngành bắt buộc viết bằng **tiếng Việt**, không dùng tiếng Anh.*
2. **Định hướng phát triển** – gợi ý học tập, chứng chỉ, hoạt động nên làm.
3. **Thu nhập bình quân gần nhất** (VNĐ/tháng) của 05 ngành trên – trích dẫn
   từ VietnamWorks hoặc TopCV (ghi rõ nguồn & thời gian).

Trả lời dưới dạng **Markdown tiếng Việt rõ ràng**.`;
}

/* ------------------------------------------------------------------ */
/* 2. Hàm gọi GPT & trả về markdown                                   */
/* ------------------------------------------------------------------ */
export async function analyseKnowdell(profile: any): Promise<string> {
  const prompt = buildPrompt(profile);

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: 'Bạn là chuyên gia hướng nghiệp.' },
      { role: 'user',   content: prompt },
    ],
  });

  return chat.choices[0].message.content.trim();
}
