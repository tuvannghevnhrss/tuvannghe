// src/app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  /* 0. Khởi tạo Supabase (đọc session từ cookie) */
  const supabase = createRouteHandlerClient({ cookies });

  /* 1. Lấy user hiện tại */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* 2. Lấy input từ body */
  let bodyReq: { product?: string; coupon?: string };
  try {
    bodyReq = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { product = "", coupon = "" } = bodyReq;

  /* 3. Tính giá */
  const PRICE: Record<string, number> = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  };

  const amountDue = PRICE[product];
  if (!amountDue) {
    return NextResponse.json(
      { error: "Invalid product" },
      { status: 400 }
    );
  }

  /* 4. Kiểm tra mã giảm giá */
  let discount = 0;
  if (coupon) {
    const { data: cp } = await supabase
      .from("coupons")
      .select("discount, expires_at")
      .eq("code", coupon)
      .gt("expires_at", new Date().toISOString()) // còn hạn
      .single();
    if (cp) discount = cp.discount;
  }

  const amountToPay = Math.max(amountDue - discount, 0);

  /* 5. Gọi Sepay tạo QR */
  const externalId = uuid();
  const sepayBody = {
    merchant_code: process.env.SEPAY_MERCHANT_CODE,
    amount: amountToPay,
    description: `Pay ${product} - ${externalId}`,
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
      body: JSON.stringify(sepayBody),
    }
  );

  if (!sepayRes.ok) {
    const msg = await sepayRes.text();
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { qr_url } = await sepayRes.json(); // Sepay trả về URL QR

  /* 6. Lưu DB */
  await supabase.from("payments").insert({
    id: externalId, // để khớp với external_id
    user_id: user.id,
    product,
    amount_due: amountDue,
    discount,
    qr_desc: sepayBody.description,
    status: "pending",
  });

  /* 7. Trả QR cho client */
  return NextResponse.json({ qr: qr_url });
}
