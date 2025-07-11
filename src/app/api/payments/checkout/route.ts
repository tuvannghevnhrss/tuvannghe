// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();          // { mbti, "MBTI90" }

  /* ── 1. Giá gốc ───────────────────────── */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 } as const;
  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* ── 2. Coupon ────────────────────────── */
  let discount = 0;
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .in("product", [product, null])        // chỉ áp cho gói hoặc global
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();
    discount = data?.discount ?? 0;
  }
  const amount = Math.max(amount_due - discount, 0);

  /* ── 3. Tạo order & lưu DB ─────────────── */
  const order_suffix = Math.random().toString(36).slice(-4).toUpperCase(); // 4 ký tự ngẫu nhiên
  const order_id     = `SEVQR ${order_suffix}`;                            // Ví dụ: SEVQR 4F9A

  await supabase.from("payments").insert({
    id: order_id,                 // để tra cứu
    user_id: user.id,
    product,
    amount_due,
    discount,
    status: "pending",
  });

  /* ── 4. Sinh QR SePay ──────────────────── */
  const params = new URLSearchParams({
    bank:     process.env.SEPAY_BANK_CODE!,  // ví dụ TCB
    acc:      process.env.SEPAY_BANK_ACC!,   // ví dụ 123456789
    amount:   amount.toString(),
    des:      order_id,                      // nội dung chuyển khoản
    template: "compact",
  });
  const qr_url = `https://qr.sepay.vn/img?${params.toString()}`;

  return NextResponse.json({ qr_url, amount, discount });
}
