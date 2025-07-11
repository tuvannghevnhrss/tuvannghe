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

  // 3. Đọc body từ client
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

  // 5. Lookup coupon (nếu có)
  let discount = 0;
  if (coupon) {
    const { data: row, error: err } = await supabase
      .from("coupons")
      .select("discount,product,expires_at")
      .eq("code", coupon)
      .single();

    if (!err && row) {
      const now = new Date();
      const exp = new Date(row.expires_at);
      const applies =
        (row.product === product || row.product === "all") &&
        exp >= now;

      if (applies) {
        discount = row.discount; // số tiền VND được giảm
      }
    }
  }

  // 6. Tính ra số tiền thực khách phải trả
  const amount = Math.max(amountDue - discount, 0);

  // 7. Tạo order_code cho SePay: chỉ lấy 4 ký tự ngẫu nhiên
  const suffix = Math.random().toString(36).slice(-4).toUpperCase();
  const order_code = suffix;

  // 8. Ghi vào bảng payments (cột amount là số tiền sau giảm)
  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    product,
    amount,
    status: "pending",
    order_code,
  });

  if (error) {
    console.error("Insert payment error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // 9. Tạo URL QR SePay (content = "SEVQR {order_code}")
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC = process.env.SEPAY_BANK_ACC!;
  const qr_url = [
    `https://qr.sepay.vn/img`,
    `?bank=${encodeURIComponent(BANK_CODE)}`,
    `&acc=${encodeURIComponent(BANK_ACC)}`,
    `&amount=${amount}`,
    `&des=${encodeURIComponent(`SEVQR ${order_code}`)}`,
    `&template=compact`,
  ].join("");

  // 10. Trả về client
  return NextResponse.json({ qr_url, amount, order_code });
}
