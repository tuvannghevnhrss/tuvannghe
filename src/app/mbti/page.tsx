/* Server-component: quyết định render Landing hay Intro */
export const dynamic = "force-dynamic";
export const metadata = {
  title: "MBTI – Career Guidance",
  description: "Khám phá tính cách MBTI và cách nó hỗ trợ định hướng nghề nghiệp của bạn.",
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import MbtiLanding from "./MbtiLanding";
import MbtiIntro from "./MbtiIntro";

export default async function MbtiPage() {
  // 1️⃣ Lấy user từ session
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // 2️⃣ Nếu CHƯA login → show Landing
  if (!user) {
    return <MbtiLanding />;
  }

  // 3️⃣ Nếu đã login, kiểm tra xem đã có kết quả MBTI chưa
  const { data: profile } = await supabase
    .from("career_profiles")
    .select("mbti_type")
    .eq("user_id", user.id)
    .maybeSingle();

  // 4️⃣ Nếu đã có kết quả → redirect sang quiz/result
  if (profile?.mbti_type) {
    redirect("/mbti/quiz");
  }

  // 5️⃣ Nếu đã login nhưng CHƯA làm quiz → render Intro (nút “Bắt đầu Quiz”)
  return <MbtiIntro hasResult={false} />;
}
