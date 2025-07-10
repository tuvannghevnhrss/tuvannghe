import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createRouteHandlerClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sig  = req.headers.get("authorization")?.replace("Bearer ", "");
  if (sig !== process.env.SEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // chỉ xử lý khi status === "PAID"
  if (body.status !== "PAID") return NextResponse.json({ ok: true });

  const supabase = createRouteHandlerClient();
  await supabase
    .from("payments")
    .update({ status: "paid", amount_paid: body.amount, paid_at: body.paid_time })
    .eq("id", body.external_id);

  // TODO: cấp quyền cho user (ví dụ update bảng user_subscriptions …)

  return NextResponse.json({ ok: true });
}
