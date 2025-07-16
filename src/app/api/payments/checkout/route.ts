// src/app/api/payments/checkout/route.ts
import { NextResponse }            from "next/server";
import { cookies }                 from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SERVICE, STATUS }         from "@/lib/constants";

const PRICE = {
  mbti    : 10_000,
  holland : 20_000,
  knowdell: 100_000,
  combo   : 90_000,             // mbti + holland
} as const;

/** Tạo URL QR theo chuẩn SePay */
function buildQR(amount: number, desc: string) {
  const { SEPAY_BANK_CODE, SEPAY_BANK_ACC } = process.env;
  return (
    `https://qr.sepay.vn/img?bank=${SEPAY_BANK_CODE}` +
    `&acc=${SEPAY_BANK_ACC}&amount=${amount}` +
    `&des=${encodeURIComponent(desc)}&template=compact`
  );
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* ------- Đọc body & kiểm tra ------- */
  const { product: rawProd, coupon: rawCode } = await req.json();
  const product = (rawProd as string || "").toLowerCase().trim() as
    keyof typeof PRICE;

  if (!PRICE[product])
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* ------- Tính amount_due ------- */
  let amount_due = PRICE[product];

  // Gói Knowdell được giảm khi user đã mua MBTI/Holland
  if (product === "knowdell") {
    const { data: paid } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", user.id)
      .eq("status", STATUS.PAID)
      .in("product", ["mbti", "holland"]);

    const already = (paid ?? [])
      .reduce((s, r) => s + PRICE[r.product as keyof typeof PRICE], 0);

    amount_due = Math.max(0, PRICE.combo - already);
  }

  /* ------- Mã giảm giá (nếu có) ------- */
  let discount   = 0;
  let promo_code: string | null = null;

  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    const expired = cpn?.expires_at && new Date(cpn.expires_at) < now;
    const wrongProduct = cpn?.product && cpn.product !== product;

    if (!cpn || expired || wrongProduct)
      return NextResponse.json(
        { error: "Mã giảm giá không hợp lệ" },
        { status: 400 },
      );

    discount   = cpn.discount ?? 0;
    promo_code = code;
  }

  const amount = Math.max(0, amount_due - discount);

  /* ------- Dữ liệu chung cho bảng payments ------- */
  const base = {
    user_id   : user.id,
    product,
    amount,
    amount_due,
    discount,
    promo_code,
  };

  /* ======= Trường hợp FREE (amount = 0) ======= */
  if (amount === 0) {
    await supabase.from("payments").insert({
      ...base,
      status      : STATUS.PAID,
      amount_paid : 0,                   // ← bõ đi nếu không có cột
      paid_at     : new Date().toISOString(),
    });
    return NextResponse.json({ free: true });
  }

  /* ======= Trường hợp cần thanh toán ======= */
  const order_code = Math.random().toString(36).slice(-4).toUpperCase();
  const qr_desc    = `SEVQR ${order_code}`;

  await supabase.from("payments").insert({
    ...base,
    status    : STATUS.PENDING,
    order_code,
    qr_desc,
  });

  return NextResponse.json({
    amount,
    qr_url    : buildQR(amount, qr_desc),
    order_code,
  });
}
