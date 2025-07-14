/* -------------------------------------------------
   KNOWDELL INTRO  –  Quyết định hiển thị nút
   (c) 2025 career-guidance-app
------------------------------------------------- */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

import KnowdellIntro from "./KnowdellIntro";

export const dynamic = "force-dynamic";

export default async function KnowdellPage() {
  /* 1. Supabase + Auth */
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/knowdell");

  /* 2. Đã thanh toán chưa? */
  const { data: pay } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("product", "knowdell")
    .eq("status", STATUS.PAID)
    .maybeSingle();
  const hasPaid = !!pay;

  /* 3. Đã có kết quả Knowdell? */
  const { data: prof } = await supabase
    .from("career_profiles")
    .select("knowdell")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasResult = Array.isArray(prof?.knowdell?.values) && prof!.knowdell.values.length > 0;

  /* 4. Render Intro với props */
  return <KnowdellIntro hasPaid={hasPaid} hasResult={hasResult} />;
}
