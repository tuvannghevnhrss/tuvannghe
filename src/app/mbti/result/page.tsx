/* ------------------------------------------------------------------
   MBTI Result – Server Component
   ------------------------------------------------------------------*/
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { MBTI_MAP as MBTI_DESCRIPTIONS } from "@/lib/mbtiDescriptions";

interface Props {
  searchParams: { code?: string };
}

export default async function MbtiResultPage({ searchParams }: Props) {
  const code = (searchParams.code ?? "").toUpperCase();
  if (!/^[EISNTFJP]{4}$/.test(code)) redirect("/mbti");

  /* 1 ▸ Auth ------------------------------------------------------------ */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/mbti");

  /* 2 ▸ Lưu kết quả & cập-nhật hồ sơ ----------------------------------- */
  await supabase.from("mbti_results").insert({ user_id: user.id, type: code });

  await supabase
    .from("career_profiles")
    .upsert(
      { user_id: user.id, mbti_type: code, updated_at: new Date() },
      { onConflict: "user_id" },
    );

  /* 3 ▸ Gửi 1 tin nhắn vào chatbot ------------------------------------- */
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: `🎉 Bạn vừa hoàn thành MBTI. Kết quả là **${code}**.`,
  });

  /* 4 ▸ Render ---------------------------------------------------------- */
  const desc = MBTI_DESCRIPTIONS[code] ?? "";

  return (
    <div className="mx-auto max-w-3xl py-20 space-y-10 text-center">
      <h1 className="text-3xl font-bold">Kết quả MBTI: {code}</h1>
      <p className="mx-auto max-w-xl">{desc}</p>

      <a
        href="/profile?step=trait"
        className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Xem Hồ sơ Phát triển nghề
      </a>
    </div>
  );
}
