import OpenAI from "openai";
import { createChatCompletion } from "@/lib/openai";

type AnswerFeedback = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  keywords: string[];
  raw_ai_json: Record<string, unknown>;
};

type SessionFeedback = {
  overall_score: number;
  communication_score: number;
  content_score: number;
  confidence_score: number;
  summary: string;
  improvement_plan: string;
  raw_ai_json: Record<string, unknown>;
};

type PersonalizedQuestion = {
  content: string;
  category?: string;
};

function clampScore(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }
  return fallback;
}

function ensureStringArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return fallback;
}

function isVietnamese(languageCode?: string) {
  return !languageCode || languageCode.toLowerCase().startsWith("vi");
}

async function readJsonCompletion(prompt: string, meta?: { sessionId?: string; userId?: string }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await createChatCompletion(
    {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an interview coach. Return strict JSON only, no markdown, no commentary.",
        },
        { role: "user", content: prompt },
      ],
    },
    { route: "interview.feedback", sessionId: meta?.sessionId, userId: meta?.userId }
  );

  const text = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

export async function createAnswerFeedback(params: {
  question: string;
  transcript: string;
  roleName?: string;
  difficultyName?: string;
  experienceLevelName?: string;
  languageCode?: string;
}) {
  const vietnamese = isVietnamese(params.languageCode);

  try {
    const parsed = await readJsonCompletion(`
${vietnamese ? "Hay danh gia cau tra loi phong van sau va tra ve bang tieng Viet." : "Evaluate this interview answer and respond in English."}
Respond with JSON in this shape:
{
  "score": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "tips": ["..."],
  "keywords": ["..."]
}

${vietnamese ? "Tat ca strengths, weaknesses, tips, keywords phai bang tieng Viet." : "All strengths, weaknesses, tips, keywords must be in English."}

Role: ${params.roleName ?? "Unknown"}
Difficulty: ${params.difficultyName ?? "Unknown"}
Experience level: ${params.experienceLevelName ?? "Unknown"}
Question: ${params.question}
Transcript: ${params.transcript}
`);

    return {
      score: clampScore(parsed.score, 78),
      strengths: ensureStringArray(
        parsed.strengths,
        vietnamese
          ? ["Tra loi dung trong tam cau hoi", "Giai thich ro rang va de theo doi"]
          : ["Stays on topic", "Explains ideas clearly"]
      ),
      weaknesses: ensureStringArray(
        parsed.weaknesses,
        vietnamese
          ? ["Can them vi du cu the va do luong ket qua"]
          : ["Needs more concrete and measurable examples"]
      ),
      tips: ensureStringArray(
        parsed.tips,
        vietnamese
          ? ["Rut gon cau tra loi va them minh chung thuc te"]
          : ["Make the answer more concise and add real examples"]
      ),
      keywords: ensureStringArray(
        parsed.keywords,
        vietnamese ? ["giao tiep", "cau truc"] : ["communication", "structure"]
      ),
      raw_ai_json: parsed,
    } satisfies AnswerFeedback;
  } catch (error) {
    console.error("createAnswerFeedback fallback:", error);
    return {
      score: 78,
      strengths: vietnamese
        ? [
            "Tra loi co cau truc va khong bi lac de",
            "Van phong giao tiep on dinh",
          ]
        : [
            "The answer has a clear structure",
            "Communication style is steady",
          ],
      weaknesses: vietnamese
        ? [
            "Can them so lieu va ket qua do luong",
            "Phan ket thuc cau tra loi con hoi nhanh",
          ]
        : [
            "Needs more measurable results",
            "The conclusion ends a bit abruptly",
          ],
      tips: vietnamese
        ? [
            "Dung STAR de sap xep y",
            "Them 1-2 thanh tich cu the trong moi cau tra loi",
          ]
        : [
            "Use the STAR structure to organize ideas",
            "Add one or two concrete achievements to each answer",
          ],
      keywords: vietnamese ? ["STAR", "thanh tich", "ro rang"] : ["STAR", "achievement", "clarity"],
      raw_ai_json: { fallback: true },
    } satisfies AnswerFeedback;
  }
}

export async function createPersonalizedQuestions(params: {
  roleName?: string;
  difficultyName?: string;
  experienceLevelName?: string;
  languageCode?: string;
  jobTitle?: string;
  jobDescription?: string;
  candidateSummary?: string;
  count?: number;
}) {
  const vietnamese = isVietnamese(params.languageCode);
  const count = params.count ?? 6;

  const parsed = await readJsonCompletion(`
${vietnamese ? "Hay tao bo cau hoi phong van ca nhan hoa bang tieng Viet." : "Create a personalized interview question set in English."}
Respond with JSON in this shape:
{
  "questions": [
    { "content": "...", "category": "behavioral|technical|situational|personalized" }
  ]
}

Rules:
- Create exactly ${count} questions.
- Questions must be practical, interview-ready, and tailored to the target role/JD/CV summary.
- Do not answer the questions.
- ${vietnamese ? "Tất cả câu hỏi phải bằng tiếng Việt có dấu, diễn đạt tự nhiên và đúng ngữ cảnh." : "All questions must be in English."}

Role group: ${params.roleName ?? "Unknown"}
Target title: ${params.jobTitle || params.roleName || "Unknown"}
Difficulty: ${params.difficultyName ?? "Unknown"}
Experience level: ${params.experienceLevelName ?? "Unknown"}
Job description:
${params.jobDescription || "(empty)"}

Candidate/CV summary:
${params.candidateSummary || "(empty)"}
`);

  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  return questions
    .map((item) => {
      const question = item as PersonalizedQuestion;
      return {
        content: String(question.content ?? "").trim(),
        category: String(question.category ?? "personalized").trim() || "personalized",
      };
    })
    .filter((item) => item.content.length > 0)
    .slice(0, count);
}

export async function createSessionFeedback(params: {
  roleName?: string;
  difficultyName?: string;
  experienceLevelName?: string;
  languageCode?: string;
  answers: Array<{ question: string; transcript: string; score?: number | null }>;
}) {
  const vietnamese = isVietnamese(params.languageCode);

  try {
    const transcriptBundle = params.answers
      .map(
        (answer, index) =>
          `Question ${index + 1}: ${answer.question}\nTranscript: ${answer.transcript}\nScore: ${answer.score ?? "n/a"}`
      )
      .join("\n\n");

    const parsed = await readJsonCompletion(`
${vietnamese ? "Hay tong hop buoi phong van sau va tra ve bang tieng Viet." : "Summarize this interview session and respond in English."}
Respond with JSON in this shape:
{
  "overall_score": 0-100,
  "communication_score": 0-100,
  "content_score": 0-100,
  "confidence_score": 0-100,
  "summary": "...",
  "improvement_plan": "..."
}

${vietnamese ? "Summary va improvement_plan phai bang tieng Viet." : "Summary and improvement_plan must be in English."}

Role: ${params.roleName ?? "Unknown"}
Difficulty: ${params.difficultyName ?? "Unknown"}
Experience level: ${params.experienceLevelName ?? "Unknown"}

Answers:
${transcriptBundle}
`);

    return {
      overall_score: clampScore(parsed.overall_score, 80),
      communication_score: clampScore(parsed.communication_score, 79),
      content_score: clampScore(parsed.content_score, 82),
      confidence_score: clampScore(parsed.confidence_score, 78),
      summary: String(
        parsed.summary ??
          (vietnamese
            ? "Ban tra loi dung trong tam va co nen tang tot, can bo sung them cac minh chung cu the."
            : "You stay on topic and have a solid foundation, but you need more concrete examples.")
      ),
      improvement_plan: String(
        parsed.improvement_plan ??
          (vietnamese
            ? "Tap mo dau 20-30 giay, chen so lieu trong cau tra loi va giu nhip noi deu hon."
            : "Practice a 20-30 second opening, add measurable examples, and keep a steadier speaking pace.")
      ),
      raw_ai_json: parsed,
    } satisfies SessionFeedback;
  } catch (error) {
    console.error("createSessionFeedback fallback:", error);
    return {
      overall_score: 80,
      communication_score: 79,
      content_score: 82,
      confidence_score: 78,
      summary: vietnamese
        ? "Ban co kha nang dien dat ro rang va tu duy hop ly, nhung van can them minh chung va diem nhan ve thanh tich."
        : "You communicate clearly and think logically, but still need more concrete examples and stronger achievement highlights.",
      improvement_plan: vietnamese
        ? "Luyen 3 buoc: mo dau tu tin, dua vi du co so lieu, ket lai bang bai hoc hoac tac dong."
        : "Practice a 3-step structure: open confidently, add measurable examples, and close with impact or lessons learned.",
      raw_ai_json: { fallback: true },
    } satisfies SessionFeedback;
  }
}

// ─── MODULE 3: LIVE AI INTERVIEW ────────────────────────────────────────────

type LiveTurn = { question: string; transcript: string };

function buildFallbackLiveQuestion(
  turnNumber: number,
  totalTurns: number,
  roleName: string,
  vietnamese: boolean
): string {
  if (turnNumber === 1) {
    return vietnamese
      ? `Xin chào! Tôi là AI Interviewer hôm nay. Bạn hãy giới thiệu bản thân và cho tôi biết lý do bạn muốn ứng tuyển vị trí ${roleName} nhé.`
      : `Hello! I'm your AI Interviewer today. Please introduce yourself and tell me why you want to apply for this ${roleName} position.`;
  }
  if (turnNumber >= totalTurns) {
    return vietnamese
      ? "Cảm ơn bạn rất nhiều vì đã tham gia buổi phỏng vấn hôm nay. Bạn có câu hỏi nào muốn hỏi tôi không?"
      : "Thank you so much for joining this interview today. Do you have any questions for me?";
  }
  const fallbackVi = [
    "Bạn có thể kể về một thành tích nổi bật nhất trong sự nghiệp của bạn không?",
    "Hãy mô tả cách bạn xử lý khi có xung đột với đồng nghiệp hoặc cấp trên.",
    "Điểm mạnh lớn nhất bạn mang lại cho vị trí này là gì?",
    "Kể cho tôi nghe về một dự án khó khăn và cách bạn vượt qua.",
  ];
  const fallbackEn = [
    "Can you tell me about your most significant professional achievement?",
    "Describe how you handle conflict with a colleague or manager.",
    "What is your greatest strength for this role?",
    "Tell me about a challenging project and how you overcame it.",
  ];
  const pool = vietnamese ? fallbackVi : fallbackEn;
  return pool[(turnNumber - 2) % pool.length];
}

export async function generateLiveQuestion(params: {
  roleName: string;
  experienceLevelName: string;
  jobTitle?: string;
  jobDescription?: string;
  interviewType?: "behavioral" | "technical" | "mixed";
  conversationHistory: LiveTurn[];
  turnNumber: number;
  totalTurns: number;
  languageCode?: string;
}): Promise<{ question: string }> {
  const vietnamese = isVietnamese(params.languageCode);
  const fallback = buildFallbackLiveQuestion(
    params.turnNumber,
    params.totalTurns,
    params.roleName,
    vietnamese
  );

  if (!process.env.OPENAI_API_KEY) {
    return { question: fallback };
  }

  const isOpener = params.turnNumber === 1 && params.conversationHistory.length === 0;
  const isClosing = params.turnNumber >= params.totalTurns;
  const targetTitle = params.jobTitle || params.roleName;

  let instruction: string;
  if (isOpener) {
    instruction = vietnamese
      ? `Đây là lượt mở đầu. Giới thiệu ngắn bản thân là AI Interviewer, chào ứng viên và đề nghị họ tự giới thiệu cùng lý do muốn ứng tuyển vị trí ${targetTitle}. Giữ tự nhiên, khoảng 60–80 chữ.`
      : `This is the opener. Briefly introduce yourself as an AI Interviewer, greet the candidate, and ask them to introduce themselves and why they want to apply for ${targetTitle}. Keep it natural, about 60–80 words.`;
  } else if (isClosing) {
    instruction = vietnamese
      ? `Đây là câu hỏi cuối. Cảm ơn ứng viên đã tham gia và hỏi họ có câu hỏi nào cho bạn không. Ngắn gọn, thân thiện.`
      : `This is the closing question. Thank the candidate for the interview and ask if they have any questions. Keep it brief and friendly.`;
  } else {
    instruction = vietnamese
      ? `Dựa trên câu trả lời vừa rồi, hãy đặt câu hỏi follow-up phù hợp hoặc khai thác khía cạnh mới liên quan đến vị trí ${targetTitle}. Câu hỏi ngắn gọn, rõ ràng (1–2 câu).`
      : `Based on the candidate's last answer, ask a relevant follow-up or explore a new area for the ${targetTitle} role. One to two sentences, direct and clear.`;
  }

  const historyText = params.conversationHistory
    .map((t, i) => `Turn ${i + 1}:\nAI: ${t.question}\nCandidate: ${t.transcript}`)
    .join("\n\n");

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: vietnamese
            ? `Bạn là AI Interviewer chuyên nghiệp đang phỏng vấn ứng viên cho vị trí ${targetTitle} (cấp ${params.experienceLevelName}). Loại phỏng vấn: ${params.interviewType ?? "mixed"}. Trả lời bằng tiếng Việt tự nhiên. Chỉ trả về nội dung câu hỏi, không giải thích thêm.`
            : `You are a professional AI Interviewer for the ${targetTitle} role (${params.experienceLevelName} level). Interview type: ${params.interviewType ?? "mixed"}. Return only the question text, no explanations.`,
        },
        ...(historyText
          ? [{ role: "user" as const, content: `Previous conversation:\n${historyText}` }]
          : []),
        { role: "user", content: instruction },
      ],
    });

    const question = response.choices[0]?.message?.content?.trim() ?? "";
    return { question: question || fallback };
  } catch (error) {
    console.error("generateLiveQuestion error:", error);
    return { question: fallback };
  }
}

// ─── PER-TURN QUICK FEEDBACK ─────────────────────────────────────────────────

export type TurnFeedback = {
  score: number;
  tone: "confident" | "neutral" | "hesitant";
  relevance: "on_topic" | "partial" | "off_topic";
  strengths: string[];
  tip: string;
  fillerCount: number;
  durationLabel: "too_short" | "adequate" | "too_long";
};

const FILLER_VI = ["ừm", "ờ", "à", "ư", "thì là", "tức là", "kiểu như", "ý là", "thật ra là"];
const FILLER_EN = ["um", "uh", "like", "you know", "basically", "literally", "so", "right", "I mean"];

function countFillers(text: string, languageCode = "vi"): number {
  const lower = text.toLowerCase();
  const fillers = languageCode.startsWith("vi") ? FILLER_VI : FILLER_EN;
  return fillers.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    return count + (lower.match(regex)?.length ?? 0);
  }, 0);
}

function assessDuration(seconds: number): TurnFeedback["durationLabel"] {
  if (seconds < 20) return "too_short";
  if (seconds > 180) return "too_long";
  return "adequate";
}

export async function createTurnFeedback(params: {
  question: string;
  transcript: string;
  durationSeconds: number;
  languageCode?: string;
}): Promise<TurnFeedback> {
  const vi = isVietnamese(params.languageCode);
  const fillerCount = countFillers(params.transcript, params.languageCode);
  const durationLabel = assessDuration(params.durationSeconds);

  const fallback: TurnFeedback = {
    score: 75,
    tone: "neutral",
    relevance: "on_topic",
    strengths: vi
      ? ["Đã trả lời đúng câu hỏi", "Diễn đạt tương đối rõ ràng"]
      : ["Addressed the question", "Reasonably clear expression"],
    tip: vi
      ? "Thêm ví dụ cụ thể với số liệu để tăng tính thuyết phục."
      : "Add specific examples with metrics to be more convincing.",
    fillerCount,
    durationLabel,
  };

  if (!process.env.OPENAI_API_KEY || !params.transcript?.trim()) return fallback;

  try {
    const parsed = await readJsonCompletion(`
${vi ? "Đánh giá nhanh câu trả lời phỏng vấn sau, trả lời bằng tiếng Việt." : "Quickly evaluate this interview answer, respond in English."}
Return strict JSON:
{
  "score": 0-100,
  "tone": "confident|neutral|hesitant",
  "relevance": "on_topic|partial|off_topic",
  "strengths": ["...", "..."],
  "tip": "..."
}

Question: ${params.question}
Answer: ${params.transcript}
Duration: ${params.durationSeconds}s
`);

    return {
      score: clampScore(parsed.score, 75),
      tone: (["confident", "neutral", "hesitant"].includes(String(parsed.tone)) ? parsed.tone : "neutral") as TurnFeedback["tone"],
      relevance: (["on_topic", "partial", "off_topic"].includes(String(parsed.relevance)) ? parsed.relevance : "on_topic") as TurnFeedback["relevance"],
      strengths: ensureStringArray(parsed.strengths, fallback.strengths).slice(0, 2),
      tip: String(parsed.tip ?? fallback.tip),
      fillerCount,
      durationLabel,
    };
  } catch {
    return fallback;
  }
}

export async function generateTTSAudio(
  text: string,
  voice: "alloy" | "nova" | "shimmer" = "shimmer"
): Promise<Buffer | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    });
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("generateTTSAudio error:", error);
    return null;
  }
}
