// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* 1. Xác thực ---------------------------------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon = "" } = await req.json();

  /* 2. Tính giá sau KM ---------------------------------------------------- */
  const PRICE = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  } as const;

  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due)
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  let discount = 0;

  if (coupon) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, expires_at")
      .eq("code", coupon.toUpperCase())
      .eq("product", product)           //  ⇠  chỉ áp dụng đúng app
      .eq("is_active", true)
      .maybeSingle();

    const isExpired =
      !cpn?.expires_at || new Date(cpn.expires_at) < new Date();

    if (cpn && !isExpired) discount = cpn.discount;
  }

  const amount = Math.max(amount_due - discount, 0); // luôn ≥ 0

  /* 3. order_code & lưu DB ---------------------------------------------- */
  const suf = Math.random().toString(36).slice(-4).toUpperCase(); // VD: 7F9X
  const order_code = suf; // SePay sẽ nhận “… SEVQR 7F9X”

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    product,
    amount,          // số tiền KH thực trả
    amount_due,      // giá gốc
    discount,        // ghi nhận KM
    status: "pending",
    order_code,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  /* 4. Sinh QR SePay ----------------------------------------------------- */
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC = process.env.SEPAY_BANK_ACC!;

  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}` +
    `&acc=${BANK_ACC}&amount=${amount}` +
    `&des=SEVQR%20${order_code}&template=compact`;

  return NextResponse.json({ qr_url, amount, order_code });
}
