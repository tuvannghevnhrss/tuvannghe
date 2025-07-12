// src/app/holland/quiz/page.tsx  (⚠️ di chuyển file quiz cũ vào đây)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import QuizClient from "./QuizClient";        // tách phần “use client” ra file riêng
import { QUESTIONS } from "../questions";

export const dynamic = "force-dynamic";

export default async function HollandQuizPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectedFrom=/holland/quiz`);

  /* Bảo vệ: chưa thanh toán thì trả về trang Intro */
  const { data } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", "holland")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.status !== "paid") redirect("/holland");

  /* Đã OK → render Client Quiz */
  return <QuizClient QUESTIONS={QUESTIONS} />;
}
