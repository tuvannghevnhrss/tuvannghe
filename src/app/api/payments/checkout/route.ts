// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

/* 🔹 NEW ----------------------------------------------------------- */
const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
const COMBO_PARTS = ["mbti", "holland", "knowdell"] as const;
/* ----------------------------------------------------------------- */

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* 1. Xác thực */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon: rawCode } = await req.json();

  /* 2. Tính **amount_due** sau khi trừ phần đã mua lẻ (nếu combo) */
  let amount_due = PRICE[product as keyof typeof PRICE] ?? 0;
  if (!amount_due) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* 🔹 NEW: nếu mua combo, trừ giá gói lẻ đã thanh toán */
  if (product === "combo") {
    const { data: paidRows } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", user.id)
      .eq("status", "PAID")
      .in("product", COMBO_PARTS);

    const alreadyPaid = paidRows?.reduce(
      (sum, r) => sum + PRICE[r.product as keyof typeof PRICE],
      0,
    ) ?? 0;

    amount_due = Math.max(0, amount_due - alreadyPaid);
  }

  /* 3. Tra coupon (nếu có) – logic cũ giữ nguyên */
  let discount = 0;
  let promo_code: string | null = null;

  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();

    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .or(`product.is.null,product.eq.${product}`)
      .lte("expires_at", "9999-12-31")
      .maybeSingle();

    const now = new Date();
    if (
      !cpn ||
      (cpn.expires_at && new Date(cpn.expires_at) < now) ||
      (cpn.product && cpn.product !== product)
    ) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    discount   = cpn.discount ?? 0;
    promo_code = code;
  }

  const amount = Math.max(0, amount_due - discount);

  /* 🔹 NEW: nếu amount = 0 → ghi luôn trạng thái PAID, không tạo QR */
  if (amount === 0) {
    await supabase.from("payments").insert({
      user_id : user.id,
      product,
      amount  : 0,
      status  : "PAID",
      promo_code,
      discount,
    });
    return NextResponse.json({ free: true });
  }

  /* 4. Order & QR */
  const suffix     = Math.random().toString(36).slice(-4).toUpperCase();
  const order_code = suffix;
  const qr_desc    = `SEVQR ${order_code}`;

  const { error: insertErr } = await supabase.from("payments").insert({
    user_id   : user.id,
    product,
    amount,
    status    : "PENDING",
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
