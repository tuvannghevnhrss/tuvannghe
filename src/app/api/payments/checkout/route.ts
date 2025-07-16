// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { STATUS } from "@/lib/constants";

const PRICE = {
  mbti    : 0,
  holland : 20_000,
  knowdell: 100_000,
  combo   : 90_000,
} as const;

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product: rawProd, coupon: rawCode } = await req.json();
  const product = (rawProd as string).toLowerCase().trim();

  /* ---------- MBTI free – ghi nhận 1 lần nếu chưa có ---------- */
  if (product === "mbti") {
    await supabase.from("payments")
      .upsert({ user_id: user.id, product: "mbti",
                amount: 0, amount_due: 0, discount: 0, status: STATUS.PAID },
              { onConflict: "user_id,product" });
    return NextResponse.json({ free: true });
  }

  /* ---------- các thanh toán đã có ---------- */
  const { data: paidBefore } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", STATUS.PAID);

  const has = (p: string) => (paidBefore ?? []).some(r => r.product === p);

  /* ---------- amount_due ---------- */
  let amount_due = PRICE[product as keyof typeof PRICE] ?? 0;

  if (product === "knowdell") {
    amount_due = has("holland") ? PRICE.knowdell : PRICE.combo;
  }

  if (product === "holland" && has("knowdell")) {
    // đã được combo tặng
    return NextResponse.json({ free: true });
  }

  /* ---------- coupon (tuỳ chọn) ---------- */
  let discount = 0, promo_code: string | null = null;
  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    if (cpn &&
        (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
        (!cpn.product    || cpn.product === product)) {
      discount   = cpn.discount ?? 0;
      promo_code = code;
    }
  }

  const amount = Math.max(0, amount_due - discount);

  /* ---------- FREE (0 đ) ---------- */
  if (amount === 0) {
    await supabase.from("payments").insert({
      user_id   : user.id,
      product,
      amount,
      amount_due,
      discount,
      status    : STATUS.PAID,
      promo_code,
    });

    // nếu là combo → tặng Holland
    if (product === "knowdell" && !has("holland")) {
      await supabase.from("payments").insert({
        user_id : user.id,
        product : "holland",
        amount  : 0,
        amount_due: PRICE.holland,
        discount  : PRICE.holland,
        status  : STATUS.PAID,
        promo_code: "COMBO",
      });
    }
    return NextResponse.json({ free: true });
  }

  /* ---------- PENDING (có QR) ---------- */
  const order_code = Math.random().toString(36).slice(-4).toUpperCase();
  const qr_desc    = `SEVQR ${order_code}`;

  await supabase.from("payments").insert({
    user_id   : user.id,
    product,
    amount,
    amount_due,
    discount,
    status    : STATUS.PENDING,
    order_code,
    qr_desc,
    promo_code,
  });

  const qr_url =
    `https://qr.sepay.vn/img?bank=${process.env.SEPAY_BANK_CODE!}` +
    `&acc=${process.env.SEPAY_BANK_ACC!}` +
    `&amount=${amount}&des=${encodeURIComponent(qr_desc)}&template=compact`;

  return NextResponse.json({ amount, qr_url, order_code });
}