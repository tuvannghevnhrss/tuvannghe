/* -------------------------------------------------------------------------- *
   GPT helper – Holland + Knowdell ➜ JSON kết quả đầy đủ                      *
 * -------------------------------------------------------------------------- */
import OpenAI from "openai";

/* ===== type gửi GPT ===== */
export interface AnalyseArgs {
  holland   : string;       // “ERS”, “CSE”, …
  values    : any[];
  skills    : any[];
  interests : string[];     // list nghề ưa thích
  model?    : string;
}

/* ===== Prompt ===== */
function buildPrompt(a: AnalyseArgs) {
  const first = (arr:any[], n:number, bullet="•") => arr
      .slice(0,n)
      .map((v:any,i:number)=>`${bullet} ${typeof v==="string"
        ? v : v.vi ?? v.value_key ?? v.skill_key ?? v}`)
      .join("\n");

  return `
Bạn là chuyên gia hướng nghiệp 10+ năm kinh nghiệm, thành thạo RIASEC (Holland) và Knowdell.

## Hồ sơ khách hàng
RIASEC (TOP-3): ${a.holland}

### Giá trị nghề nghiệp
${first(a.values,10)}

### Kỹ năng động lực
${first(a.skills ,20)}

### Nghề khách hàng hứng thú
${first(a.interests,20)}

## Yêu cầu
1. Tóm tắt khung tính cách (≤ 120 chữ).
2. Đánh giá mức phù hợp cho từng nghề ưa thích (Rất phù hợp / Phù hợp / Ít phù hợp) + lý do ngắn (trích dẫn RIASEC / Value / Skill).
3. Bảng TOP 5 nghề điểm cao nhất gồm:
   • lương khởi điểm (triệu VND/tháng, median)  
   • lộ trình 3 giai đoạn  
   • kỹ năng / chứng chỉ nên bổ sung.

Trả đúng **JSON duy nhất** (không thêm Markdown):
{
  "summary":"",
  "careerRatings":[
    {"career":"","fitLevel":"","reason":""}
  ],
  "topCareers":[
    {
      "career":"",
      "salaryMedian":0,
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

/* ===== Gọi GPT ===== */
const openai = new OpenAI({ timeout:60_000 });

export async function analyseKnowdell(a:AnalyseArgs){
  const resp = await openai.chat.completions.create({
    model : a.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    temperature:0.3,
    max_tokens :900,
    messages:[
      {role:"system",content:"Bạn luôn trả về **một** JSON hợp lệ duy nhất."},
      {role:"user"  ,content:buildPrompt(a)}
    ]
  });

  const txt   = resp.choices[0].message.content ?? "";
  const json  = txt.slice(txt.indexOf("{"), txt.lastIndexOf("}")+1);
  return JSON.parse(json);
}

/* -------------------------------------------------------------------------- *
   Alias analyseCareer (dùng trong Route)                                     *
 * -------------------------------------------------------------------------- */
interface RawProfile {
  holland_profile : Record<string,number>|null;
  knowdell_summary: { values?:any[]; skills?:any[]; interests?:any[] }|null;
}

export async function analyseCareer(p:RawProfile){
  if(!p.holland_profile) throw new Error("Thiếu Holland profile");

  const values  = p.knowdell_summary?.values  ?? [];
  const skills  = p.knowdell_summary?.skills  ?? [];
  let   inter   = p.knowdell_summary?.interests ?? [];

  if(inter.length===0) inter = values.slice(0,3);           // fallback nhẹ
  inter = inter.map((it:any)=>
      typeof it==="string"
        ? it
        : it.interest_key||it.value_key||it.skill_key||it.vi||it.en||""
    ).filter(Boolean);

  if(inter.length===0) throw new Error("Thiếu sở thích nghề nghiệp");

  const holland = Object.entries(p.holland_profile)
    .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k).join("");

  return await analyseKnowdell({ holland, values, skills, interests:inter });
}
