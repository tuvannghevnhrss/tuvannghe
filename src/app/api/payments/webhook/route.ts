// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Apikey ", "");
  if (secret !== process.env.SEPAY_WEBHOOK_SECRET)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await req.json();
  /* SePay gửi:
     {order_code:"ODIKO5DW4F2", amount:10000, status:"paid", ...}
  */
  const { order_code, amount } = payload;
  const supabase = createRouteHandlerClient({ cookies: () => {} });

  await supabase
    .from("payments")
    .update({ status: "paid", amount_paid: amount, paid_at: new Date() })
    .eq("id", order_code);

  return NextResponse.json({ ok: true });
}
