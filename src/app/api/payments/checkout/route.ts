// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import { createRouteHandlerClient }
        from "@supabase/auth-helpers-nextjs";
import { v4 as uuid }   from "uuid";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { product, coupon } = await req.json();

  /* 1. Lấy user từ cookie */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Tính giá
  const PRICE: Record<string, number> = {
    mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000,
  };
  const amountDue = PRICE[product] ?? 0;
  if (!amountDue) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  // 3. Giảm giá
  let discount = 0;
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (data) discount = data.discount;
  }
  const amountToPay = Math.max(amountDue - discount, 0);

  // 4. Gọi Sepay
  const externalId = uuid();
  const body = {
    merchant_code: process.env.SEPAY_MERCHANT_CODE,
    amount       : amountToPay,
    description  : `Pay ${product} - ${externalId}`,
    external_id  : externalId,
    callback_url : `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
  };

  const sepayRes = await fetch(`${process.env.SEPAY_ENDPOINT}/v1/transactions`, {
    method : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization : `Bearer ${process.env.SEPAY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!sepayRes.ok) {
    return NextResponse.json({ error: await sepayRes.text() }, { status: 500 });
  }
  const { qr_url } = await sepayRes.json();

  // 5. Lưu DB
  await supabase.from("payments").insert({
    id         : externalId,
    user_id    : user.id,
    product,
    amount_due : amountDue,
    discount,
    amount_paid: amountToPay,
    qr_desc    : body.description,
    status     : "pending",
  });

  return NextResponse.json({ qr: qr_url, amount: amountToPay });
}
