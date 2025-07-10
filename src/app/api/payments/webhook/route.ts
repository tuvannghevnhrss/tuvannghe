// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  /* 1. Xác thực API-Key */
  const apiKey = req.headers.get("authorization")?.replace("Apikey ", "");
  if (apiKey !== process.env.SEPAY_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json();      // { external_id, status, amount_paid, ... }
  const { external_id, status } = payload;

  /* 2. Cập nhật bảng payments */
  const supabase = createRouteHandlerClient({ cookies: undefined });
  if (status === "PAID") {
    await supabase
      .from("payments")
      .update({ status: "paid", paid_at: new Date().toISOString(), amount_paid: payload.amount })
      .eq("id", external_id);
  }

  return NextResponse.json({ received: true });
}
