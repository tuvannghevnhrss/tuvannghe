// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  /* 1. Khởi Supabase + lấy user ------------------------------------ */
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon = "" } = await req.json();

  /* 2. Bảng giá & kiểm tra sản phẩm -------------------------------- */
  const PRICE = {
    mbti:     10_000,
    holland:  20_000,
    knowdell: 100_000,
    combo:    90_000,
  } as const;

  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due)
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* 3. Tính giảm giá (tra bảng coupons) ----------------------------- */
  let discount = 0;

  if (coupon.trim()) {
    const { data: cp } = await supabase
      .from("coupons")
      .select("value, product")
      .eq("code", coupon.trim().toUpperCase())
      .eq("active", true)
      .lte("start_at", new Date().toISOString())
      .gte("end_at",   new Date().toISOString())
      .maybeSingle();

    // hợp lệ khi: còn hiệu lực + áp cho đúng product hoặc ALL
    if (cp && (cp.product === product || cp.product === null))
      discount = Math.min(cp.value, amount_due);
  }

  const amount = Math.max(amount_due - discount, 0);

  /* 4. Tạo order_code “SEVQR XXXX” – đảm bảo UNIQUE ----------------- */
  let order_code = "";
  for (;;) {
    order_code = randomUUID().slice(0, 4).toUpperCase();       // 4 ký tự
    const { count } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_code", order_code);
    if (!count) break;                                         // chưa trùng
  }

  /* 5. Ghi DB (để PG tự sinh cột id bigserial) --------------------- */
  const { error } = await supabase.from("payments").insert({
    user_id   : user.id,
    product   ,
    amount_due,
    discount  ,
    amount    ,
    status    : "pending",
    order_code,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  /* 6. Tạo QR SePay ------------------------------------------------- */
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;
  const TEMPLATE  = "compact";

  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}` +
    `&acc=${BANK_ACC}&amount=${amount}` +
    `&des=SEVQR%20${order_code}&template=${TEMPLATE}`;

  return NextResponse.json({ qr_url, amount, order_code });
}
