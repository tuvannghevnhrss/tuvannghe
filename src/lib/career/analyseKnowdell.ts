import OpenAI from "openai";

/* ---------- Kiểu tham số truyền cho GPT ---------- */
export interface AnalyseArgs {
  mbti: string;               // không bắt buộc
  holland: string;            // VD "ERS"
  values: any[];
  skills: any[];
  interests: any[];           // phải ≠ 0 trước khi gọi GPT
  selectedTitles: string[];   // <= 20 nghề ưa thích
  model?: string;
}

/* ---------- Prompt ---------- */
function buildPrompt(a: AnalyseArgs) {
  const valList = a.values.slice(0, 10)
    .map((v: any, i) => `${i + 1}. ${v.vi || v.value_key || v}`)
    .join("\n");

  const skillList = a.skills.slice(0, 20)
    .map((s: any) =>
      `• ${s.skill_key || s} – đam mê ${s.love ?? 0}/5, thành thạo ${s.pro ?? 0}/5`,
    )
    .join("\n");

  const careers = a.selectedTitles.slice(0, 20)
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  return `
Bạn là chuyên gia hướng nghiệp 10+ năm kinh nghiệm, thành thạo RIASEC (Holland) và Knowdell.

## Hồ sơ khách hàng
RIASEC: ${a.holland}

### Giá trị nghề nghiệp (TOP 10)
${valList}

### Kỹ năng động lực nổi bật
${skillList}

### 20 nghề khách hàng hứng thú
${careers}

## Yêu cầu
1. Tóm tắt khung tính cách (≤ 120 chữ).
2. Đánh giá mức phù hợp cho từng nghề  + lý do ngắn (trích dẫn RIASEC / Value / Skill).
3. Bảng TOP 5 nghề (điểm cao nhất) gồm: lương khởi điểm (triệu VND/tháng, median),
   lộ trình 3 giai đoạn và kỹ năng / chứng chỉ nên bổ sung.

### Định dạng trả lời
Trả đúng JSON duy nhất – KHÔNG thêm Markdown:
{
  "summary": "",
  "careerRatings":[
    {"career":"", "fitLevel":"", "reason":""}
  ],
  "topCareers":[
    {
      "career":"", "salaryMedian":0,
      "roadmap":[
        {"stage":"Junior","skills":""},
        {"stage":"Mid","skills":""},
        {"stage":"Senior","skills":""}
      ]
    }
  ]
}
`.trim();
}

/* ---------- Hàm gọi GPT ---------- */
const openai = new OpenAI({ timeout: 60_000 });

export async function callGPT(args: AnalyseArgs) {
  const prompt     = buildPrompt(args);
  const model      = args.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens : 900,
    messages   : [
      { role: "system", content: "Bạn luôn trả về JSON hợp lệ duy nhất." },
      { role: "user",   content: prompt },
    ],
  });

  const txt   = resp.choices[0].message.content?.trim() || "";
  const start = txt.indexOf("{");
  const end   = txt.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Không tìm thấy JSON.");

  return JSON.parse(txt.slice(start, end + 1));
}
