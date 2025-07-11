import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };
  const price = PRICE[product as keyof typeof PRICE];
  if (!price) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* --- áp coupon --- */
  let discount = 0;
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .eq("product", product)
      .gte("expires_at", new Date().toISOString())
      .single();
    if (data) discount = data.discount;
  }
  const amount = Math.max(price - discount, 0);

  /* --- tạo order --- */
  const order_id = `SEVQR ${nanoid(4).toUpperCase()}`; // ex: SEVQR X1A9
  await supabase.from("payments").insert({
    id: order_id,
    user_id: user.id,
    product,
    amount_due : price,
    discount,
    status     : "pending",
  });

  /* --- link QR Sepay --- */
  const qr_url =
    `https://qr.sepay.vn/img?bank=${process.env.SEPAY_BANK_CODE}` +
    `&acc=${process.env.SEPAY_BANK_ACC}` +
    `&amount=${amount}` +
    `&des=${order_id}&template=compact`;

  return NextResponse.json({ qr_url, order_id, amount });
}
