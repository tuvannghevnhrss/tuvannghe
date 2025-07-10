// src/app/api/payment/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const PRICES = { mbti: 10000, holland: 20000, knowdell: 100000, combo: 90000 };

export async function POST(req: NextRequest) {
  const body = await req.json();            // { product, coupon }
  const { product, coupon } = body;
  const amount = PRICES[product as keyof typeof PRICES];
  if (!amount) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Check coupon
  let discount = 0;
  if (coupon) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon.toUpperCase())
      .gte("expires_at", new Date().toISOString())
      .single();
    if (cpn) discount = cpn.discount!;
  }
  const amount_due = amount;
  const amount_real = Math.max(amount_due - discount, 0);

  // Insert pending payment
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      product,
      amount_due,
      discount,
      qr_desc: `Pay ${product}-${user.id}`,
    })
    .select()
    .single();

  // Call Sepay (pseudo)
  const resp = await fetch(process.env.SEPAY_BASE_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SEPAY_API_KEY}` },
    body: JSON.stringify({
      amount: amount_real,
      description: payment.qr_desc,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?id=${payment.id}`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`,
    }),
  }).then(r => r.json());

  // Giả sử Sepay trả về { qr_image_url }
  return NextResponse.json({
    payment_id: payment.id,
    qr_url: resp.qr_image_url,
    amount: amount_real,
  });
}
