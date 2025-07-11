// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();

  /* 1. Tính tiền */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };
  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due)
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  // TODO: áp dụng coupon → discount
  const amount = amount_due;

  /* 2. Tạo mã đơn + lưu DB */
  const order_id = `OD${Date.now().toString(36).toUpperCase()}${Math.floor(
    Math.random() * 1000,
  )}`; // VD: ODIKO5DW4F2

  await supabase.from("payments").insert({
    id: order_id,
    user_id: user.id,
    product,
    amount_due,
    discount: 0,
    status: "pending",
  });

  /* 3. Tạo link QR động theo guide SePay */
  const BANK_CODE = process.env.SEPAY_BANK_CODE;        // VD: TCB
  const BANK_ACC  = process.env.SEPAY_BANK_ACC;         // VD: 123456789
  const TEMPLATE  = "compact";                          // hoặc “qronly”
  const qr_url = `https://qr.sepay.vn/img?bank=${BANK_CODE}&acc=${BANK_ACC}` +
                 `&amount=${amount}&des=${order_id}&template=${TEMPLATE}`;

  return NextResponse.json({ qr_url, amount, order_id });
}
