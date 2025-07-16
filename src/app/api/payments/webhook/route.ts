// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { STATUS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  // ① Nhận payload từ SePay
  const body = await req.json();        // { desc: "SEVQR Q2DR", amount: 2000, ... }

  // ② (Tùy cài đặt) xác thực chữ ký HMAC/secret của SePay
  //    -> Nếu fail: return 401

  // ③ Tách order_code đã lưu trong cột  `order_code`
  const order_code = body?.desc?.match(/SEVQR\s+([A-Z0-9]{4})/)?.[1];
  if (!order_code) return NextResponse.json({ ok: false });

  const supabase = createRouteHandlerClient({ cookies });

  // ④ Cập-nhật bản ghi
  const { error } = await supabase
    .from("payments")
    .update({ status: STATUS.PAID })
    .eq("order_code", order_code)
    .eq("amount", body.amount)          // tránh nhầm giao dịch khác
    .eq("status", STATUS.PENDING);

  if (error) return NextResponse.json({ ok: false });

  return NextResponse.json({ ok: true });
}
