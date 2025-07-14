export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { MBTI_MAP } from "@/lib/mbtiDescriptions";          // 👈 thêm dòng này

interface Props {
  searchParams: { code?: string };
}

export default async function MBTIResultPage({ searchParams }: Props) {
  const code = (searchParams.code ?? "").toUpperCase();

  /* 0. Validate: E/I S/N T/F J/P */
  if (!/^[EI][SN][FT][JP]$/.test(code)) redirect("/mbti");

  /* 1. Supabase */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/mbti");

  /* 2. Ghi bảng mbti_results */
  await supabase.from("mbti_results").insert({
    user_id: user.id,
    type_code: code,
  });

  /* 3. Upsert career_profiles.mbti */
  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: user.id, mbti: { type: code }, updated_at: new Date() },
      { onConflict: "user_id" }
    );

  /* 4. Đẩy tin nhắn vào Chatbot */
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: `🎉 Chúc mừng! Bạn vừa hoàn thành trắc nghiệm MBTI và kết quả là **${code}**. Hãy đặt câu hỏi cho tôi nếu muốn tìm hiểu sâu hơn nhé!`,
  });

  /* 5. Lấy mô tả từ MBTI_MAP */
  const info = MBTI_MAP[code];

  return (
    <div className="max-w-3xl mx-auto py-20 space-y-10">
      <h1 className="text-3xl font-bold text-center">Kết quả MBTI: {code}</h1>

      <section className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Mô tả tính cách</h2>
        <p>{info?.intro ?? "Đang cập nhật mô tả."}</p>
      </section>

      {info && (
        <>
          <section className="bg-white shadow rounded-lg p-6 space-y-2">
            <h2 className="text-xl font-semibold">Điểm mạnh</h2>
            <ul className="list-disc list-inside">
              {info.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-2">
            <h2 className="text-xl font-semibold">Điểm cần lưu ý</h2>
            <ul className="list-disc list-inside">
              {info.flaws.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white shadow rounded-lg p-6 space-y-2">
            <h2 className="text-xl font-semibold">Nghề nghiệp gợi ý</h2>
            <ul className="list-disc list-inside">
              {info.careers.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="text-center">
        <a
          href="/profile"
          className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Xem Hồ sơ Phát triển nghề
        </a>
      </div>
    </div>
  );
}
