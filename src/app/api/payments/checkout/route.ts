// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* 1. Xác thực */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon: rawCode } = await req.json();
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* 2. Tra coupon (nếu có) */
  let discount = 0;
  let promo_code: string | null = null;

  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();

    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      // coupon áp dụng cho tất cả hoặc đúng product
      .or(`product.is.null,product.eq.${product}`)
      .lte("expires_at", "9999-12-31")        // PG đòi điều kiện nào đó => ta lọc hạn bên dưới
      .maybeSingle();

    if (!cpn) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    // hết hạn?
    if (cpn.expires_at && new Date(cpn.expires_at) < new Date()) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    // sai product?
    if (cpn.product && cpn.product !== product) {
      return NextResponse.json({ error: "Mã giảm giá không áp dụng cho sản phẩm này" }, { status: 400 });
    }

    discount    = cpn.discount ?? 0;
    promo_code  = code;
  }

  const amount = Math.max(0, amount_due - discount);

  /* 3. Order & QR */
  const suffix     = Math.random().toString(36).slice(-4).toUpperCase();
  const order_code = suffix;
  const qr_desc    = `SEVQR ${order_code}`;

  const { error: insertErr } = await supabase.from("payments").insert({
    user_id   : user.id,
    product,
    amount,
    status    : "pending",
    promo_code,
    discount,
    qr_desc,
  });

  if (insertErr) {
    console.error("Insert payment error:", insertErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;

  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}` +
    `&acc=${BANK_ACC}&amount=${amount}&des=${encodeURIComponent(qr_desc)}` +
    `&template=compact`;

  return NextResponse.json({ amount, qr_url, order_code });
}
