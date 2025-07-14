export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

interface Props {
  searchParams: { code?: string };
}

/* ── Giải thích 6 nhóm R-I-A-S-E-C ───────────────────── */
const TRAITS: Record<string, string> = {
  R: "Realistic – Ưa hành động, thao tác với vật thể.",
  I: "Investigative – Phân tích, khám phá, thích nghiên cứu.",
  A: "Artistic – Sáng tạo, trực giác, biểu đạt ý tưởng.",
  S: "Social – Hỗ trợ, hợp tác, giúp đỡ người khác.",
  E: "Enterprising – Thuyết phục, lãnh đạo, kinh doanh.",
  C: "Conventional – Tỉ mỉ, dữ liệu, quy trình, tổ chức.",
};

const explain = (code: string) =>
  code
    .split("")
    .map((c) => TRAITS[c] ?? c)
    .join(" | ");

export default async function HollandResultPage({ searchParams }: Props) {
  /* ------------------------------------------------------------------ */
  /* 0. Lấy & validate mã Holland (3 ký tự R / I / A / S / E / C)      */
  /* ------------------------------------------------------------------ */
  const code = (searchParams.code ?? "").toUpperCase();
  if (!/^[RIASEC]{3}$/.test(code)) redirect("/holland");

  /* ------------------------------------------------------------------ */
  /* 1. Supabase + Auth                                                 */
  /* ------------------------------------------------------------------ */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  /* ------------------------------------------------------------------ */
  /* 2. Lưu kết quả vào DB                                              */
  /* ------------------------------------------------------------------ */
  /* 2a. Ghi bảng holland_results (lịch sử) */
  await supabase.from("holland_results").insert({
    user_id: user.id,
    code,
  });

  /* 2b. Upsert vào career_profiles.holland (hồ sơ hiện tại) */
  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: user.id, holland: { code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  /* 2c. Gửi tin nhắn vào chatbot */
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "assistant", // đổi tên cột nếu bạn dùng khác
    content: `🎉 Chúc mừng! Bạn vừa hoàn thành trắc nghiệm Holland. Kết quả của bạn là **${code}**. Hãy hỏi tôi nếu muốn gợi ý nghề nghiệp phù hợp nhé!`,
  });

  /* ------------------------------------------------------------------ */
  /* 3. UI                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
      <h1 className="text-3xl font-bold">Kết quả Holland: {code}</h1>

      <div className="rounded-lg bg-white p-6 shadow text-left">
        <p>{explain(code)}</p>
      </div>

      <a
        href="/profile?step=trait"
        className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Xem Hồ sơ Phát triển nghề
      </a>
    </div>
  );
}
