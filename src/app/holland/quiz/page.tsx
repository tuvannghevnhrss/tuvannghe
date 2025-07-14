// -----------------------------------------------------------------------------
// src/app/holland/quiz/page.tsx
// Server Component bảo vệ route Quiz Holland
// -----------------------------------------------------------------------------

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import QuizClient from "./QuizClient";      // 👈 default import (không ngoặc)

export const dynamic = "force-dynamic";

export default async function HollandQuizPage() {
  /* 1. Auth ----------------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/holland/quiz");

  /* 2. Kiểm tra thanh toán --------------------------------------------------- */
  const { data } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", "holland")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.status !== "paid") {
    redirect("/holland");                   // Chưa trả phí → về trang Intro
  }

  /* 3. Render Client-side Quiz ---------------------------------------------- */
  return <QuizClient />;
}
