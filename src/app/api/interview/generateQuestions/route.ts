import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabaseServer";
import { createRoom } from "@/lib/daily";

export async function POST(req: Request) {
  try {
    const { cv, jd, req: jobReq } = await req.json();

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Bạn là senior recruiter. Dựa trên CV, JD và YÊU CẦU bên dưới,
tạo đúng 5 câu hỏi STAR, trả KẾT QUẢ ở định dạng JSON ARRAY
KHÔNG kèm \`\`\` hay văn bản giải thích nào khác. 
CV: ${cv}
JD: ${jd}
YÊU CẦU: ${jobReq}`.trim(),
        },
      ],
    });

    // ─── new: bóc code-fence nếu GPT vẫn lỡ gắn ─────────────
    let raw = (gptRes.choices[0].message.content || "").trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/```[\s\S]*?\n/, "")    // bỏ dòng ```json
               .replace(/```$/, "")             // bỏ ``` cuối
               .trim();
    }

    const questions = JSON.parse(raw);

    /* 2) Tạo phòng Daily */
    const room = await createRoom();
    if (!room.id || !room.url) {
      console.error("❌ Daily error:", room);
      throw new Error("Tạo phòng video thất bại – kiểm tra DAILY_API_KEY & Allowed Origins");
    }

    /* 3) Lưu Supabase */
    const { error: dbErr } = await supabase.from("interview_sessions").insert({
      id: room.id,
      url: room.url,
      cv,
      jd,
      req: jobReq,
      questions,
    });
    if (dbErr) {
      console.error("❌ Supabase error:", dbErr);
      throw new Error("Lưu dữ liệu vào Supabase lỗi – kiểm tra bảng & quyền");
    }

    /* 4) Trả kết quả thành công */
    return NextResponse.json({ roomId: room.id });
  } catch (err: any) {
    /* Ghi log server & trả JSON lỗi */
    console.error("generateQuestions →", err);
    return NextResponse.json({ error: err.message || "Unknown server error" }, { status: 500 });
  }
}
