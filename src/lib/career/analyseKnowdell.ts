import OpenAI from "openai";

/* ---------- Kiểu dữ liệu ---------- */
export interface JobInfo {
  title  : string;
  salary : number;      // median start salary
}

/* ---------- Prompt ---------- */
function buildPrompt(
  holland: string,
  values : any[],
  skills : any[],
  interests: string[],
  shortlist: JobInfo[],
) {
  const val = values .slice(0,10).map((v:any,i)=>`${i+1}. ${v.vi||v.value_key}`).join("\n");
  const skl = skills .slice(0,20).map((s:any)=>`• ${s.skill_key}`).join("\n");
  const list= shortlist.slice(0,20).map((j,i)=>`${i+1}. ${j.title} – ${j.salary} tr`).join("\n");

  return `
Bạn là chuyên gia hướng nghiệp 10+ năm (RIASEC & Knowdell).

## Hồ sơ
RIASEC (top-3): ${holland}

### Giá trị cốt lõi
${val}

### Kỹ năng động lực
${skl}

### 20 nghề gợi ý (kèm lương median)
${list}

## Yêu cầu
1. Tóm tắt khung tính cách (≤120 chữ).
2. Đánh giá mức phù hợp cho từng nghề (Rất phù hợp/Phù hợp/Ít phù hợp) kèm lý do ngắn (trích dẫn RIASEC/Value/Skill).
3. Bảng **TOP 5 nghề** gồm: lương khởi điểm (triệu VND/tháng, median), lộ trình 3 giai đoạn, kỹ năng/chứng chỉ nên bổ sung.

### Định dạng trả lời
Trả đúng **JSON** duy nhất (không Markdown):
{
  "summary":"",
  "careerRatings":[{"career":"","fitLevel":"","reason":""}],
  "topCareers":[
    {"career":"","salaryMedian":0,"roadmap":[
      {"stage":"Junior","skills":""},
      {"stage":"Mid","skills":""},
      {"stage":"Senior","skills":""}
    ]}
  ]
}`.trim();
}

/* ---------- GPT ---------- */
const openai = new OpenAI({ timeout: 60_000 });

async function askGPT(prompt: string, model = "gpt-3.5-turbo") {
  const rsp = await openai.chat.completions.create({
    model, temperature:0.3, max_tokens:800,
    messages:[
      {role:"system",content:"Bạn luôn trả về JSON hợp lệ duy nhất."},
      {role:"user",  content:prompt},
    ],
  });
  const txt = rsp.choices[0].message.content?.trim()||"";
  const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
  if(s===-1||e===-1) throw new Error("GPT không trả JSON");
  return JSON.parse(txt.slice(s,e+1));
}

/* ---------- API công khai cho route ---------- */
export async function analyseCareer(profile: {
  holland_profile : Record<string,number>|null;
  knowdell_summary: {values?:any[];skills?:any[];}|null;
  interests       : string[];             // từ bảng knowdell_interests
  shortlist       : JobInfo[];            // 20 nghề match Holland
}) {
  if(!profile.holland_profile) throw new Error("Thiếu Holland profile");

  /* top-3 Holland */
  const holland = Object.entries(profile.holland_profile)
    .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c])=>c).join("");

  const result = await askGPT(
    buildPrompt(
      holland,
      profile.knowdell_summary?.values ?? [],
      profile.knowdell_summary?.skills ?? [],
      profile.interests,
      profile.shortlist,
    ),
  );

  /* rút gọn 5 nghề (chuỗi) để lưu */
  return (result.topCareers??[])
    .slice(0,5)
    .map((j:any)=>String(j.career||"").trim())
    .filter(Boolean);
}
