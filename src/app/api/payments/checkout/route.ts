// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Khởi Supabase client với cookie
  const supabase = createRouteHandlerClient({ cookies });

  // 2. Xác thực user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Read body
  const { product, coupon } = await req.json();

  // 4. Tính số tiền gốc theo product
  const PRICE = {
    mbti: 10_000,
    holland: 20_000,
    knowdell: 100_000,
    combo: 90_000,
  } as const;
  const amountDue = PRICE[product as keyof typeof PRICE];
  if (!amountDue) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  // 5. (TODO) Áp dụng coupon lookup nếu cần, tạm thời không giảm
  const amount = amountDue;

  // 6. Tạo mã đơn hàng ngắn gọn: SEVQR + 4 ký tự
  const suffix = Math.random().toString(36).slice(-4).toUpperCase(); // ex: "7F9X"
  const order_code = suffix;

  // 7. Lưu vào DB (Supabase sẽ tự gán id serial)
  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    product,
    amount,         // CHỈ dùng cột `amount`; đã bỏ `amount_due`
    status: "pending",
    order_code,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // 8. Build URL QR SePay
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;
  // Chú ý: content phải chứa “SEVQR␣{order_code}” để SePay parse
  const qr_url = [
    `https://qr.sepay.vn/img`,
    `?bank=${encodeURIComponent(BANK_CODE)}`,
    `&acc=${encodeURIComponent(BANK_ACC)}`,
    `&amount=${amount}`,
    `&des=${encodeURIComponent(`SEVQR ${order_code}`)}`,
    `&template=compact`,
  ].join("");

  // 9. Trả về client
  return NextResponse.json({ qr_url, amount, order_code });
}
