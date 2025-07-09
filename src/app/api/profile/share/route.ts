import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);   // thêm env vào Vercel/.env

export async function POST(req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauth" },{ status:401 });

  /* 1. Lấy full hồ sơ */
  const { data: profile } = await supa
    .from("career_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error:"No profile" },{ status:400 });

  /* 2. Render HTML siêu đơn giản */
  const html = `
    <h2>Hồ sơ Phát triển nghề của bạn</h2>
    <ul>
      <li><b>MBTI:</b> ${profile.mbti?.type ?? "Chưa có"}</li>
      <li><b>Holland:</b> ${profile.holland?.code ?? "Chưa có"}</li>
      <li><b>Giá trị:</b> ${(profile.knowdell?.values ?? []).map((v:any)=>v.value_key).join(", ")}</li>
      <li><b>Kỹ năng:</b> ${(profile.knowdell?.skills ?? []).map((s:any)=>s.skill_key).join(", ")}</li>
      <li><b>Sở thích:</b> ${(profile.knowdell?.interests ?? []).map((i:any)=>i.interest_key).join(", ")}</li>
    </ul>
    <p>Hãy quay lại trang Chatbot để được AI tư vấn thêm nhé!</p>
  `;

  /* 3. Gửi email */
  await sgMail.send({
    to: user.email!,
    from: "no-reply@career-ai.app",
    subject: "Hồ sơ phát triển nghề của bạn",
    html,
  });

  /* 4. Lưu tin nhắn vào bảng chat_messages */
  await supa.from("chat_messages").insert({
    user_id: user.id,
    role: "system",
    content: `Tóm tắt hồ sơ:\nMBTI: ${profile.mbti?.type ?? "?"}\nHolland: ${profile.holland?.code ?? "?"}`,
  });

  return NextResponse.json({ ok:true });
}
