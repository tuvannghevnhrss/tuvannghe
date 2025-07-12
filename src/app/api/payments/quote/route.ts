/* src/app/api/payments/checkout/route.ts
   Tạo QR + ghi bảng payments với số tiền sau khi trừ khuyến mãi         */
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

/* Bảng giá gốc */
const PRICE = {
  mbti   : 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo  : 90_000,
} as const;

/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* 1️⃣ - Xác thực */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product: prodRaw = "", coupon: codeRaw = "" } = await req.json();
  const product = (prodRaw as string).toLowerCase().trim();

  /* 2️⃣ - Giá gốc */
  const amount_due = PRICE[product as keyof typeof PRICE] ?? 0;
  if (amount_due === 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  /* 3️⃣ - Tính giảm giá */
  let discount = 0;
  if (codeRaw) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, expires_at, product")
      .eq("code", codeRaw.toUpperCase())
      .maybeSingle();

    const now = new Date();

    if (
      cpn &&
      (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
      (!cpn.product    || cpn.product === product)
    ) {
      discount = cpn.discount ?? 0;
    }
  }

  const amount   = Math.max(0, amount_due - discount);   // 💰 thực trả
  const orderRef = Math.random().toString(36).slice(-4).toUpperCase(); // 4 ký tự
  const qrDesc   = `SEVQR ${orderRef}`;

  /* 4️⃣ - Ghi DB */
  const { error } = await supabase.from("payments").insert({
    user_id   : user.id,
    product,
    amount,            // 👉 số tiền thực tế
    status    : "pending",
    order_ref : orderRef,
    promo_code: codeRaw || null,
    discount ,
    qr_desc   : qrDesc,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  /* 5️⃣ - Tạo QR SePay với **amount** sau giảm */
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;

  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}` +
    `&acc=${BANK_ACC}&amount=${amount}` +
    `&des=${encodeURIComponent(qrDesc)}` +
    `&template=compact`;

  return NextResponse.json({ qr_url, amount, order_ref: orderRef });
}
