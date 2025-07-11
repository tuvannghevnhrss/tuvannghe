// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  /* ---- 0. Xác thực ---- */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();          // ex: { mbti, "MBTI90" }

  /* ---- 1. Giá gốc ---- */
  const PRICE = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  } as const;

  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due)
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* ---- 2. Coupon (nếu có) ---- */
  let discount = 0;

  if (coupon) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount")             // lấy cột bạn muốn, hoặc percent,...
      .eq("code", coupon)             // đúng mã
      .in("product", [product, null]) // đúng gói hoặc global
      .gte("expires_at", new Date().toISOString()) // còn hạn
      .limit(1)
      .single();                      // ← chỉ 1 bản ghi

    discount = cpn?.discount ?? 0;    // không tìm thấy ⇢ 0
  }

  const amount = Math.max(amount_due - discount, 0);

  /* ---- 3. Tạo order & lưu DB ---- */
  const order_id =
    "OD" +
    Date.now().toString(36).toUpperCase() +
    Math.floor(Math.random() * 1_000).toString().padStart(3, "0"); // VD: ODK80S7D0E3

  await supabase.from("payments").insert({
    id: order_id,
    user_id: user.id,
    product,
    amount_due,
    discount,
    status: "pending",
  });

  /* ---- 4. Sinh URL QR động SePay ---- */
  const BANK_CODE = process.env.SEPAY_BANK_CODE; // ví dụ: TCB
  const BANK_ACC  = process.env.SEPAY_BANK_ACC;  // ví dụ: 123456789
  const TEMPLATE  = "compact";

  const params   = new URLSearchParams({
    bank: BANK_CODE!,
    acc : BANK_ACC!,
    amount: amount.toString(),
    des: order_id,      // nội dung chuyển khoản = mã đơn
    template: TEMPLATE,
  });

  const qr_url = `https://qr.sepay.vn/img?${params.toString()}`;

  return NextResponse.json({ qr_url, amount, order_id, discount });
}
