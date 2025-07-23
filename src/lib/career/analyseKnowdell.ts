// -----------------------------------------------------------------------------
// src/lib/career/analyseKnowdell.ts
// -----------------------------------------------------------------------------
import OpenAI from "openai";

/* ────────────────────── KIỂU THAM SỐ GỐC ────────────────────── */
export interface AnalyseArgs {
  mbti: string;          // "INTJ" – hiện không bắt buộc
  holland: string;       // "SCE", "ERS"…
  values: any[];
  skills: any[];
  interests: any[];
  /** tối đa 20 nghề khách hàng đã tick “rất hứng thú” (có thể rỗng) */
  selectedTitles: string[];
  model?: string;
}

/* ────────────────────── BUILD PROMPT ────────────────────── */
function buildPrompt(a: AnalyseArgs) {
  const valList = (a.values ?? [])
    .slice(0, 10)
    .map((v: any, i: number) => `${i + 1}. ${v.vi || v.value_key}`)
    .join("\n");

  const skillList = (a.skills ?? [])
    .slice(0, 20)
    .map(
      (s: any) =>
        `• ${s.skill_key} – đam mê ${s.love ?? 0}/5, thành thạo ${s.pro ?? 0}/5`,
    )
    .join("\n");

  const careers = (a.selectedTitles ?? [])
    .slice(0, 20)
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
1. Tóm tắt khung tính cách (≤120 chữ).
2. Đánh giá mức phù hợp cho từng nghề (Rất phù hợp/Phù hợp/Ít phù hợp) + lý do ngắn (trích dẫn RIASEC/Value/Skill).
3. Bảng TOP 5 nghề (điểm cao nhất) gồm: lương khởi điểm (triệu VND/tháng, median), lộ trình 3 giai đoạn và kỹ năng/chứng chỉ nên bổ sung.

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

/* ────────────────────── HÀM GỌI GPT ────────────────────── */
const openai = new OpenAI({ timeout: 60_000 });

export async function analyseKnowdell(args: AnalyseArgs) {
  const model = args.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  const prompt = buildPrompt(args);

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      { role: "system", content: "Bạn luôn trả về JSON hợp lệ duy nhất." },
      { role: "user",   content: prompt },
    ],
  });

  /* Parse JSON an toàn */
  const text  = resp.choices[0].message.content?.trim() ?? "";
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Không tìm thấy JSON.");

  return JSON.parse(text.slice(start, end + 1));
}

/* -------------------------------------------------------------------------- */
/*  ALIAS analyseCareer  – dùng trong route API                               */
/* -------------------------------------------------------------------------- */

/** Kiểu khớp record từ bảng `career_profiles` */
interface RawProfile {
  holland_profile: Record<string, number> | null;
  knowdell_summary: {
    values?: any[];
    skills?: any[];
    interests?: any[];
    /** có dự án cũ lưu dưới field ‘careers’ */
    careers?: any[];
  } | null;
}

/**
 * Trả về mảng gợi ý nghề (tối đa 5) dùng cho front-end.
 * Hàm **không** ném lỗi khi chỉ thiếu interests – thay vào đó trả mảng rỗng
 * để route API có thể xử lý hợp lệ.
 */
export async function analyseCareer(profile: RawProfile) {
  /* ---------- Lấy 3 chữ Holland mạnh nhất ---------- */
  if (!profile.holland_profile)
    throw new Error("Thiếu Holland profile");

  const hollandTop3 = Object.entries(profile.holland_profile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
    .join("");

  /* ---------- Lấy interests ---------- */
  const raw = profile.knowdell_summary ?? {};
  const interests =
    raw.interests && raw.interests.length
      ? raw.interests
      : raw.careers && raw.careers.length
        ? raw.careers
        : [];

  if (interests.length === 0)
    throw new Error("Thiếu sở thích nghề nghiệp");

  /* ---------- Gọi GPT ---------- */
  const result = await analyseKnowdell({
    mbti:      "", // MBTI không bắt buộc
    holland:   hollandTop3,
    values:    raw.values  ?? [],
    skills:    raw.skills  ?? [],
    interests,             // luôn ≥1 phần tử ở bước trên
    selectedTitles: interests.slice(0, 20),
  });

  return (result.topCareers ?? [])
    .slice(0, 5)
    .map((c: any) => String(c.career || "").trim())
    .filter(Boolean);
}
