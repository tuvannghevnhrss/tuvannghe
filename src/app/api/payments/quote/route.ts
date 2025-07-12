// src/app/api/payments/quote/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { product, code } = await req.json();

  /* giá gốc */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
  const amount_due = PRICE[product as keyof typeof PRICE] ?? 0;

  /* tra bảng coupons */
  const { data: coupon } = await supabase
    .from("coupons")
    .select("discount, product, expires_at")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  let discount = 0;
  if (
    coupon &&
    (!coupon.product || coupon.product === product) &&
    (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
  ) {
    discount = coupon.discount;
  }

  /* luôn tối thiểu 1 000 đ để tránh 0 */
  const amount = Math.max(amount_due - discount, 1_000);

  return NextResponse.json({ amount, discount });
}
