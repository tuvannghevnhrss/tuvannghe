// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuid } from "uuid";

const PRICE: Record<string, number> = {
  mbti: 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo: 90_000,
};

export async function POST(req: Request) {
  const supabase = createClient();
  const { product, coupon } = await req.json();

  /* 1. Lấy user */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* 2. Tính tiền */
  const amountDue = PRICE[product];
  if (!amountDue) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  let discount = 0;
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select()
      .eq("code", coupon)
      .gte("expires_at", new Date().toISOString())
      .single();
    if (data) discount = data.discount;
  }
  const amount = Math.max(amountDue - discount, 0);

  /* 3. Tạo QR bên Sepay */
  const externalId = uuid();
  const body = {
    merchant_code: process.env.SEPAY_MERCHANT_CODE,
    amount,
    description: `pay-${product}-${externalId}`,
    external_id: externalId,
    callback_url:
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
  };

  const sepayRes = await fetch(
    `${process.env.SEPAY_ENDPOINT}/v1/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SEPAY_API_KEY}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!sepayRes.ok) {
    const errTxt = await sepayRes.text();
    console.error("Sepay error:", errTxt);
    return NextResponse.json({ error: "Sepay failure" }, { status: 502 });
  }

  const { qr_url } = await sepayRes.json();

  /* 4. Lưu DB */
  await supabase.from("payments").insert({
    id: externalId,
    user_id: user.id,
    product,
    amount_due: amountDue,
    discount,
    amount_paid: null,
    qr_desc: body.description,
    status: "pending",
  });

  return NextResponse.json({ qr_url, amount });
}
