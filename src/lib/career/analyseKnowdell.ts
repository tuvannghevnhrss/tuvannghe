import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Gọi GPT, trả về markdown đã format (Tiếng Việt) */
export async function analyseKnowdell(profile: any) {
  const prompt = `
Bạn là cố vấn nghề nghiệp. Phân tích mức độ phù hợp của ứng viên
dựa trên:
- MBTI: ${profile.mbti ?? 'chưa có'}
- Holland: ${profile.holland ?? 'chưa có'}
- Giá trị (Knowdell): ${profile.values?.join(', ') ?? 'chưa có'}
- Kỹ năng yêu thích: ${profile.skills?.map((s: any) => s.key).join(', ') ?? 'chưa có'}

Trả lời bằng **Markdown tiếng Việt**, chia 4 mục:
1. **Tóm tắt**
2. **Điểm mạnh**
3. **Điểm cần cải thiện**
4. **Định hướng phát triển**
`;

  const chat = await openai.chat.completions.create({
    model   : 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return chat.choices[0].message.content?.trim() ?? '';
}
