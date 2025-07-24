import OpenAI from 'openai';

const openai = new OpenAI();

/**
 * Trả về chuỗi **markdown** 4 nhóm Knowdell đã phân tích.
 * @param profile hàng trong bảng `profiles`
 */
export async function analyseKnowdell(profile: any) {
  const prompt = `
Bạn là cố vấn nghề nghiệp. Phân tích mức độ phù hợp của ứng viên
dựa trên:
- MBTI: ${profile.mbti ?? 'chưa có'}
- Holland: ${profile.holland ?? 'chưa có'}
- Giá trị (Knowdell): ${profile.values?.join(', ') ?? 'chưa có'}
- Kỹ năng yêu thích: ${profile.skills?.map((s:any)=>s.key).join(', ') ?? 'chưa có'}

Trả lời bằng markdown Vietnamese, chia 4 mục:
1. **Tóm tắt**
2. **Điểm mạnh**
3. **Điểm cần cải thiện**
4. **Định hướng phát triển**`;

  const { choices } = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  return choices[0].message.content.trim();
}
