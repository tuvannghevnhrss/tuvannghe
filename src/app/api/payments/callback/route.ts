// src/app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const payload = await req.json(); // { payment_id, status, paid_at }
  if (payload.status !== "PAID") return NextResponse.json({ ok: true });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
  await supabase
    .from("payments")
    .update({ status: "paid", amount_paid: payload.amount, paid_at: new Date() })
    .eq("id", payload.payment_id);

  return NextResponse.json({ ok: true });
}
