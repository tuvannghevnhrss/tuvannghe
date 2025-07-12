// ⬅️ KHÔNG “use client”
export const dynamic = "force-dynamic";

import HollandIntro from "./HollandIntro";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function HollandPage() {
  const supabase = createServerComponentClient({ cookies });

  /* 1. Lấy user */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* 2. Kiểm tra:
        - đã có kết quả?   (bảng holland_results)
        - đã thanh toán?   (bảng payments, product = 'holland', status = 'paid')
  */
  let hasPaid = false;
  let hasResult = false;

  if (user) {
    const { data: pay } = await supabase
      .from("payments")
      .select("status")
      .eq("user_id", user.id)
      .eq("product", "holland")
      .eq("status", "paid")
      .single();

    hasPaid = !!pay;

    const { data: result } = await supabase
      .from("holland_results")
      .select("id")
      .eq("user_id", user.id)
      .single();

    hasResult = !!result;
  }

  return <HollandIntro hasPaid={hasPaid} hasResult={hasResult} />;
}
