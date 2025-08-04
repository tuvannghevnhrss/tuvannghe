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
Bạn là chuyên gia tư vấn hướng nghiệp. Bạn cần phân tích và đề xuất nghề nghiệp phù hợp cho ứng viên dựa trên kết quả từ các đánh giá sau đây:

Kết quả Holland (Điểm % mỗi nhóm): {Holland_scores}

Danh sách Sở thích nghề nghiệp (Knowdell): {Knowdell_Interests}

Kỹ năng tạo động lực hàng đầu (Knowdell): {Knowdell_Skills}

Giá trị nghề nghiệp quan trọng nhất (Knowdell): {Knowdell_Values}

Dựa trên các thông tin trên, hãy thực hiện các bước sau:

1. Liệt kê đúng 05 ngành nghề phù hợp nhất với ứng viên
Tên ngành phải bằng tiếng Việt, rõ ràng, không viết tiếng Anh.

Với mỗi ngành, bạn cần giải thích cụ thể vì sao ngành này phù hợp với điểm số Holland, sở thích nghề nghiệp, kỹ năng và giá trị nghề nghiệp của ứng viên.

2. Định hướng phát triển cho từng ngành nghề
Cho mỗi ngành nghề đã liệt kê, đề xuất một lộ trình phát triển rõ ràng bao gồm:

Học tập: Các khóa học cụ thể (tên môn, lĩnh vực).

Chứng chỉ: Những chứng chỉ chuyên môn, kỹ năng cần thiết.

Hoạt động: Các hoạt động cụ thể nên tham gia để phát triển kỹ năng và trải nghiệm thực tế.

3. Thu nhập bình quân gần nhất của 05 ngành nghề trên
Liệt kê rõ mức thu nhập trung bình hàng tháng (VNĐ/tháng).

Nguồn tham khảo (VietnamWorks hoặc TopCV) và thời gian cập nhật rõ ràng.

4. Tổng hợp và đánh giá chung
Tóm tắt ngắn gọn thế mạnh chung của ứng viên.

Lưu ý những điểm cần phát triển thêm dựa vào kết quả các đánh giá.

Đưa ra nhận định về sự phù hợp tổng thể với các ngành nghề đã liệt kê.

Trả lời chi tiết, đầy đủ, rõ ràng bằng markdown tiếng Việt để ứng viên dễ dàng áp dụng ngay vào kế hoạch phát triển nghề nghiệp.

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
