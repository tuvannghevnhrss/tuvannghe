// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";

export async function POST(request: Request) {
  // 1. Khởi tạo supabase client (server) kèm cookie để lấy session
  const supabase = createRouteHandlerClient({ cookies });

  // 2. Lấy user đang login
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Đọc body từ client
  const { product, coupon } = await request.json();

  // 4. Tính giá gốc
  const PRICE_MAP = { mbti: 10000, holland: 20000, knowdell: 100000, combo: 90000 };
  const amountDue = PRICE_MAP[product as keyof typeof PRICE_MAP];
  if (!amountDue) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  // 5. Kiểm tra mã khuyến mãi
  let discount = 0;
  if (coupon) {
    const { data: coupons } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      // <= today
      .lte("expires_at", new Date().toISOString());

    if (coupons && coupons.length > 0) {
      discount = coupons[0].discount;
    }
  }

  const amountToPay = Math.max(amountDue - discount, 0);
  const externalId = uuid();

  // 6. Gọi Sepay
  const body = {
    merchant_code: process.env.SEPAY_MERCHANT_CODE,
    amount: amountToPay,
    description: `MBTI payment - ${externalId}`,
    external_id: externalId,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
  };

  const resp = await fetch(
    `${process.env.SEPAY_ENDPOINT}/v1/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SEPAY_API_KEY}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    // nếu Sepay lỗi, trả về nguyên văn
    const text = await resp.text();
    return NextResponse.json({ error: text }, { status: 502 });
  }
  const sepayData = await resp.json(); // { qr_url, … }

  // 7. Lưu vào bảng `payments`
  await supabase.from("payments").insert({
    id: externalId,
    user_id: user.id,
    product,
    amount_due: amountDue,
    discount,
    qr_desc: body.description,
    status: "pending",
  });

  // 8. Trả về client
  return NextResponse.json({
    qr_url: sepayData.qr_url,
    amount: amountToPay,
  });
}
