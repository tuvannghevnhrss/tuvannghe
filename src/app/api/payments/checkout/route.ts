import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";

export async function POST(request: Request) {
  // 1) Tạo client gắn với cookie của request
  const supabase = createRouteHandlerClient({ cookies });

  // 2) Lấy user từ session
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3) Đọc body JSON
  const { product, coupon } = await request.json();

  // 4) Xác định giá gốc
  const PRICE_MAP = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  };
  const amountDue = PRICE_MAP[product as keyof typeof PRICE_MAP];
  if (!amountDue) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  // 5) Kiểm tra coupon (nếu có)
  let discount = 0;
  if (coupon) {
    const { data: couponRows } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .gt("expires_at", new Date().toISOString()); // chưa hết hạn
    if (couponRows?.length) {
      discount = couponRows[0].discount;
    }
  }
  const amountToPay = Math.max(amountDue - discount, 0);

  // 6) Gọi Sepay tạo QR
  const externalId = uuid();
  const body = {
    merchant_code: process.env.SEPAY_MERCHANT_CODE,
    amount: amountToPay,
    description: `Pay ${product} - ${externalId}`,
    external_id: externalId,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/webhook`,
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
    }
  );

  if (!sepayRes.ok) {
    const errorText = await sepayRes.text();
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const sepayData = await sepayRes.json();

  // 7) Lưu vào bảng payments
  await supabase.from("payments").insert({
    id: externalId,
    user_id: user.id,
    product,
    amount_due: amountDue,
    discount,
    qr_desc: body.description,
    status: "pending",
  });

  // 8) Trả về URL QR cho client
  return NextResponse.json({ qr: sepayData.qr_url });
}
