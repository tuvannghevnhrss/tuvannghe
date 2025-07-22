/* MBTI Quiz – server component */
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import MbtiClient from "./MbtiClient";

interface Props { searchParams: { start?: string } }

export default async function MbtiQuizPage({ searchParams }: Props) {
  /* 0 – buộc có ?start=1 (chặn F5 ở giữa) */
  if (searchParams.start !== "1") redirect("/mbti");

  /* 1 – Auth --------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/mbti");

  /* 2 – nếu đã làm rồi thì về Intro --------------------------------- */
  const { data } = await supabase
    .from("mbti_results")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (data) redirect("/mbti");

  /* 3 – render client quiz ------------------------------------------ */
  return <MbtiClient />;
}
