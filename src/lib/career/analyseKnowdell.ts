import OpenAI from "openai";

/* ───────────────── KIỂU THAM SỐ ───────────────── */
export interface AnalyseArgs {
  mbti: string;          // không bắt buộc
  holland: string;       // "ERS"…
  values: any[];
  skills: any[];
  interests: any[];
  selectedTitles: string[];
  model?: string;
}

/* ───────────────── BUILD PROMPT ───────────────── */
function buildPrompt(a: AnalyseArgs) {
  const val  = a.values  .slice(0, 10).map((v:any,i)=>`${i+1}. ${v.vi||v.value_key}`).join("\n");
  const skl  = a.skills  .slice(0, 20).map((s:any)=>`• ${s.skill_key} – đam mê ${s.love??0}/5, thành thạo ${s.pro??0}/5`).join("\n");
  const list = a.selectedTitles.slice(0, 20).map((t,i)=>`${i+1}. ${t}`).join("\n");

  return `
Bạn là chuyên gia hướng nghiệp 10+ năm kinh nghiệm (RIASEC & Knowdell).

## Hồ sơ
RIASEC (top-3): ${a.holland}

### Giá trị cốt lõi
${val}

### Kỹ năng động lực
${skl}

### 20 nghề gợi ý (kèm lương median)
${list}

## Yêu cầu
1. Tóm tắt khung tính cách (≤120 chữ).
2. Đánh giá mức phù hợp cho từng nghề (Rất phù hợp/Phù hợp/Ít phù hợp) + lý do ngắn (trích dẫn RIASEC/Value/Skill).
3. Bảng **TOP 5** nghề gồm: lương khởi điểm (triệu VND/tháng, median), lộ trình 3 giai đoạn, kỹ năng/chứng chỉ nên bổ sung.

### Định dạng trả lời
Trả đúng **JSON** duy nhất (không Markdown):
{
  "summary":"",
  "careerRatings":[{"career":"","fitLevel":"","reason":""}],
  "topCareers":[
    {
      "career":"","salaryMedian":0,
      "roadmap":[
        {"stage":"Junior","skills":""},
        {"stage":"Mid","skills":""},
        {"stage":"Senior","skills":""}
      ]
    }
  ]
}`.trim();
}

/* ───────────────── GPT CALL ───────────────── */
const openai = new OpenAI({ timeout: 60_000 });

/* ✅ NAMED-EXPORT – để route.ts import được */
export async function analyseKnowdell(args: AnalyseArgs) {
  const model  = args.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  const prompt = buildPrompt(args);

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens : 800,
    messages   : [
      { role:"system", content:"Bạn luôn trả về JSON hợp lệ duy nhất." },
      { role:"user"  , content: prompt }
    ],
  });

  const txt   = resp.choices[0].message.content?.trim() ?? "";
  const start = txt.indexOf("{");
  const end   = txt.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Không tìm thấy JSON.");

  return JSON.parse(txt.slice(start, end + 1));
}

/* ----------------------------------------------------------------- */
/*  ALIAS analyseCareer – gọi hàm trên & rút gọn 5 nghề              */
/* ----------------------------------------------------------------- */
interface RawProfile {
  holland_profile : Record<string, number> | null;
  knowdell_summary: { values?: any[]; skills?: any[]; interests?: any[] } | null;
  interests?: string[];            // (route.ts truyền vào sẵn)
  shortlist ?: {title:string;salary:number}[]; // (route.ts truyền vào)
}

export async function analyseCareer(profile: RawProfile) {
  if (!profile.holland_profile)
    throw new Error("Thiếu Holland profile");

  const interests = profile.interests ?? (
    profile.knowdell_summary?.interests?.map((i:any)=>i.interest_key)||[]
  );
  if (interests.length === 0)
    throw new Error("Thiếu sở thích nghề nghiệp");

  const hollandTop3 = Object.entries(profile.holland_profile)
    .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k).join("");

  const result = await analyseKnowdell({
    mbti     : "",
    holland  : hollandTop3,
    values   : profile.knowdell_summary?.values ?? [],
    skills   : profile.knowdell_summary?.skills ?? [],
    interests,
    selectedTitles: (profile.shortlist ?? []).map(j=>j.title),
  });

  return result;
}
