/*  src/app/api/payments/checkout/route.ts
    Nhận yêu cầu thanh toán – tạo bản ghi payments (PENDING hoặc PAID)
    Trả về: {free:true}  -hoặc-  {amount, qr_url, order_code}
------------------------------------------------------------------- */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { STATUS, SERVICE } from "@/lib/constants";

const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;

/* ---------- POST ---------- */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  /* --- 1. Lấy thông tin request --- */
  let { product, coupon: rawCode } = await req.json();
  product = (product as string).toLowerCase().trim();

  /* --- 2. Tính amount_due & discount --- */
  let amount_due = PRICE[product as keyof typeof PRICE] ?? 0;
  if (!amount_due) return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });

  /* Giảm giá combo (nếu mua Knowdell sau cùng) */
  if (product === "knowdell") {
    const { data: paid } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", user.id)
      .eq("status", STATUS.PAID)
      .in("product", ["mbti", "holland"]);
    const already = paid?.reduce((s, r) => s + PRICE[r.product as keyof typeof PRICE], 0) ?? 0;
    amount_due = Math.max(0, PRICE.combo - already);
  }

  /* Áp mã coupon (nếu có) */
  let discount = 0;
  let promo_code: string | null = null;

  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    if (
      !cpn ||
      (cpn.expires_at && new Date(cpn.expires_at) < now) ||
      (cpn.product && cpn.product !== product)
    ) {
      return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
    }
    discount   = cpn.discount ?? 0;
    promo_code = code;
  }

  const amount = Math.max(0, amount_due - discount);

  /* --- 3. amount = 0  → ACTIVE ngay --- */
  if (amount === 0) {
    await supabase.from("payments").insert({
      user_id   : user.id,
      product,
      amount    : 0,
      status    : STATUS.PAID,
      promo_code,
      discount,
      amount_due,
      amount_paid: 0,
    });
    return NextResponse.json({ free: true });
  }

  /* --- 4. amount > 0  → tạo QR SePay --- */
  const order_code = Math.random().toString(36).slice(-4).toUpperCase();          // VD: Q8TB
  const qr_desc    = `SEVQR ${order_code}`;

  await supabase.from("payments").insert({
    user_id,
    product,
    amount,
    status     : STATUS.PENDING,
    promo_code,
    discount,
    qr_desc,
    order_code,
    amount_due,
  });

  /* Tạo link QR */
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;
  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}&acc=${BANK_ACC}` +
    `&amount=${amount}&des=${encodeURIComponent(qr_desc)}&template=compact`;

  return NextResponse.json({ amount, qr_url, order_code });
}
