// -- server function, KHÔNG cần auth --
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ① đọc body sepay
  const payload = await req.json();          // { code_bank:"TCB", des:"SEVQR ZA80", money: 9000, ... }
  const desc: string = payload.des ?? "";

  // ② chỉ xử lý giao dịch bắt đầu bằng “SEVQR ”
  if (!desc.startsWith("SEVQR ")) return NextResponse.json({ ok: true });

  const order_id = desc.split(" ")[1];       // "ZA80"

  const supabase = createRouteHandlerClient({ cookies });

  // ③ cập nhật đơn
  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("id", order_id);

  return NextResponse.json({ ok: true });
}
