/*  src/app/api/payments/webhook/route.ts
    SePay gọi tới (webhook) khi nhận tiền → cập-nhật giao dịch
---------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { STATUS } from "@/lib/constants";

export async function POST(req: Request) {
  const payload = await req.json();               // dữ liệu do SePay gửi
  /*
    Ví dụ payload:
    {
      "gateway":"VietinBank",
      "transactionDate":"2025-07-16 17:04:02",
      "content":"CT DEN:519810759252 SEVQR X8G0",
      "transferAmount":2000,
      "id":17840015,
      ...
    }
  */

  const { content = "", transferAmount, id } = payload as Record<string, any>;
  const match = content.match(/SEVQR\s+([A-Z0-9]{4})/);
  if (!match) return NextResponse.json({ ok: false, reason: "Không tìm thấy order_code" });

  const order_code = match[1];

  const supabase = createRouteHandlerClient<Database>({});

  /* tìm giao dịch PENDING tương ứng & cập-nhật */
  const { error } = await supabase
    .from("payments")
    .update({
      status      : STATUS.PAID,
      amount_paid : transferAmount,
      paid_at     : new Date().toISOString(),
    })
    .eq("order_code", order_code)
    .eq("status", STATUS.PENDING);

  if (error) {
    console.error("Webhook update error", error);
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
