import OpenAI from "openai";

export interface AnalyseArgs {
  mbti: string;                     // "ESFJ"
  holland: string;                  // "SER"
  values: any;                      // array từ career_profiles.knowdell.values
  skills: any;                      // array từ career_profiles.knowdell.skills
  interests: any;                   // array từ career_profiles.knowdell.interests
  selectedTitles: string[];         // 20 nghề Knowdell user pick
  model?: string;                   // muốn ép 3.5 ? gán "gpt-3.5-turbo-0125"
}

/* ---------------- helper build strings ---------------- */
function buildPrompt(a: AnalyseArgs) {
  const valList = (a.values ?? [])
    .slice(0, 10)
    .map((v: any, idx: number) => `${idx + 1}. ${v.value_key}`)
    .join("  \n");

  const skillList = (a.skills ?? [])
    .slice(0, 20)
    .map(
      (s: any) =>
        `${s.skill_key}: điểm đam mê ${s.love ?? 0}/5 · thành thạo ${s.pro ?? 0}/5`
    )
    .join("  \n");

  const careers = a.selectedTitles
    .map((c, i) => `${i + 1}. ${c}`)
    .join("  \n");

  return `
### SYSTEM ###
Bạn là chuyên gia hướng nghiệp với hơn 10 năm kinh nghiệm áp dụng lý thuyết MBTI, Holland (RIASEC), Values, Skills & Interests vào tư vấn lựa chọn nghề nghiệp.  
Nhiệm vụ của bạn là (1) diễn giải ngắn gọn đặc điểm tính cách/động lực của khách hàng, (2) đối chiếu 20 nghề họ yêu thích với hồ sơ tính cách & giá trị, (3) xếp hạng và gợi ý lộ trình phát triển nghề phù hợp, (4) trình bày kết quả bằng tiếng Việt, định dạng JSON + bảng Markdown để hệ thống có thể lưu thẳng vào CSDL.

### USER ###
**Hồ sơ khách hàng**  
• MBTI: ${a.mbti}  
• Holland (RIASEC): ${a.holland}  
• Giá trị nghề nghiệp ưu tiên (TOP 10, ghi đúng thứ tự quan trọng giảm dần):  
${valList}

• Kỹ năng tạo động lực nổi bật (tối đa 15–20 mục, mỗi mục dạng “<kỹ năng>: <mức thành thạo/đam mê>”):  
${skillList}

**Danh sách 20 nghề nghiệp khách hàng thấy hấp dẫn**  
${careers}

**Yêu cầu phân tích**  
1. Tóm tắt *khung tính cách* của khách hàng (≤ 120 chữ) dựa trên MBTI & Holland.  
2. Với mỗi nghề trong danh sách, đánh giá mức độ phù hợp (Rất phù hợp / Phù hợp / Cần cân nhắc / Ít phù hợp) và lý do ngắn gọn (≤ 40 chữ), có trích dẫn tới MBTI, Holland, giá trị, kỹ năng liên quan.  
3. Tạo bảng xếp hạng **TOP 5 nghề** (theo điểm phù hợp cao nhất) kèm:  
   • Mức lương khởi điểm VN hiện tại (ước tính trung vị, đơn vị: triệu VND/tháng).  
   • Lộ trình phát triển 3 giai đoạn (Junior → Mid → Senior/Expert).  
   • Kỹ năng & chứng chỉ nên bổ sung cho từng giai đoạn.  
4. Xuất kết quả ở 2 định dạng:  
   a. **JSON** - dùng đúng key dưới đây (để backend ghi CSDL):  
   \`\`\`json
   {
     "summary": "...",
     "careerRatings":[
       {"career":"", "fitLevel":"", "reason":""}
     ],
     "topCareers":[
       {
         "career":"",
         "salaryMedian": 0,
         "roadmap":[
           {"stage":"Junior","focusSkills":[]},
           {"stage":"Mid","focusSkills":[]},
           {"stage":"Senior","focusSkills":[]}
         ]
       }
     ]
   }
   \`\`\`
   b. **Markdown Table** – trình bày đẹp cho người dùng đọc.
`.trim();
}

/* ---------------- main function ---------------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyseKnowdell(args: AnalyseArgs) {
  const model =
    args.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = buildPrompt(args);

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  return resp.choices[0].message.content?.trim() ?? "";
}
