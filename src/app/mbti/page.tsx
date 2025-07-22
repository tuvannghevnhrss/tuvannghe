/* MBTI Intro – server component (không “use client”) */
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import MbtiIntro from "./MbtiIntro";

export default async function MbtiIntroPage() {
  /* 1 – Auth --------------------------------------------------------- */
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/mbti");

  /* 2 – đã có kết quả?  --------------------------------------------- */
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type")
    .eq("user_id", user.id)
    .maybeSingle();

  /* 3 – render ------------------------------------------------------- */
  return <MbtiIntro hasResult={!!profile?.mbti_type} />;
}
