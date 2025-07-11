import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

/* -------------------------------------------------- */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* 1. Xác thực */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();

  /* 2. Tính tiền */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  // TODO: lookup coupon
  const amount = amount_due;

  /* 3. Tạo order_code: “SEVQR ” + 4 ký tự ngẫu nhiên */
  const suffix = Math.random().toString(36).slice(-4).toUpperCase(); // VD: 7F9X
  const order_code = suffix;                                         // trong content SePay = “… SEVQR 7F9X”

  /* 4. Ghi DB – KHÔNG truyền id, để PG tự gán bigserial */
  const { error } = await supabase.from("payments").insert({
    user_id : user.id,
    product ,
    amount  : amount_due,
    status  : "pending",
    order_code,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  /* 5. Tạo QR động (SePay) */
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;
  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}` +
    `&acc=${BANK_ACC}&amount=${amount}&des=SEVQR%20${order_code}` +
    `&template=compact`;

  return NextResponse.json({ qr_url, amount, order_code });
}
