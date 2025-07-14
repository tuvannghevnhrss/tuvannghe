/* ---------- Server Component intro cho Knowdell ---------- */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import KnowdellIntro from "./KnowdellIntro";
import { SERVICE, STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function KnowdellPage() {
  /* Lấy session */
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/signup");

  /* Đã trả phí Knowdell? */
  const { data: pay } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("product", SERVICE.KNOWDELL)
    .eq("status", STATUS.PAID)
    .maybeSingle();

  /* Đã có kết quả?  (bạn đổi table nếu khác) */
  const { data: done } = await supabase
    .from("knowdell_results")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <KnowdellIntro
      hasPaid={Boolean(pay)}
      hasResult={Boolean(done)}
    />
  );
}
