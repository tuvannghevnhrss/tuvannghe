import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/* -------------------------------------------------- */
export async function POST(req: Request) {
  const payload = await req.json();                // JSON SePay gửi
  const content = payload.description ?? payload.content ?? ""; // tuỳ gateway

  /* 1. Rút order_code sau “SEVQR ” (4 ký tự)  */
  const match = content.match(/SEVQR\s+([A-Z0-9]{4})/i);
  if (!match) return NextResponse.json({ ok: true, msg: "no-order-code" });

  const order_code = match[1].toUpperCase();
  const supabase   = createRouteHandlerClient({ cookies }); // không cần session

  /* 2. Cập nhật status = paid */
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("order_code", order_code)
    .eq("status", "pending");

  if (error) console.error("Webhook update error:", error);

  /* 3. Bắt buộc trả { ok:true } để SePay báo thành công */
  return NextResponse.json({ ok: true });
}
