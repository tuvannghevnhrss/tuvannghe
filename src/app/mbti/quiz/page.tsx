/* ------------------------------------------------------------------
   MBTI Quiz – Server Component
   ------------------------------------------------------------------*/
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import MbtiClient from "./MbtiClient";          // client-side quiz UI

interface Props {
  searchParams: { start?: string };
}

export const dynamic = "force-dynamic";         // luôn chạy trên Edge / Node

export default async function MbtiQuizPage({ searchParams }: Props) {
  /* 0 ▸ buộc ?start=1 để tránh F5 ở giữa -------------------------------- */
  if (searchParams.start !== "1") redirect("/mbti");

  /* 1 ▸ Auth – nếu chưa login → về login -------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/mbti");

  /* 2 ▸ Đã có kết quả → không làm lại ----------------------------------- */
  const { data: result } = await supabase
    .from("mbti_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (result) redirect("/mbti");                // nút Intro sẽ thành “Xem lại”

  /* 3 ▸ Hiện quiz (client component) ------------------------------------ */
  return <MbtiClient />;
}
