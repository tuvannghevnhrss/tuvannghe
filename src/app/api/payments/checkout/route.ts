// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient }   from "@/utils/supabase/server";
import { v4 as uuid }     from "uuid";

export async function POST(req: Request) {
  const supabase = createClient();
  const { product, coupon } = await req.json();
  const { data: { user } }  = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const PRICE_MAP = { mbti: 10000, holland: 20000, knowdell: 100000, combo: 90000 };
  const amountDue  = PRICE_MAP[product as keyof typeof PRICE_MAP];
  if (!amountDue) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  // kiểm mã khuyến mãi...
  let discount = 0;
  if (coupon) {
    const { data: coupons } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .gte("expires_at", new Date().toISOString());
    if (coupons?.length) discount = coupons[0].discount;
  }
  const amountToPay = Math.max(amountDue - discount, 0);

  // Tạo Sepay QR
  const externalId = uuid();
  const body = {
    merchant_code:  process.env.SEPAY_MERCHANT_CODE,
    amount:         amountToPay,
    description:    `Pay ${product} - ${externalId}`,
    external_id:    externalId,
    callback_url:   `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
  };
  const resp = await fetch(`${process.env.SEPAY_ENDPOINT}/v1/transactions`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${process.env.SEPAY_API_KEY!}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: text }, { status: 502 });
  }

  const sepay = await resp.json(); // { qr_url, ... }

  await supabase.from("payments").insert({
    id:          externalId,
    user_id:     user.id,
    product,
    amount_due:  amountDue,
    discount,
    qr_desc:     body.description,
    status:      "pending",
  });

  return NextResponse.json({ qr: sepay.qr_url });
}
