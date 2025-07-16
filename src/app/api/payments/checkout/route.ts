// src/app/api/payments/checkout/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { SERVICE, STATUS } from "@/lib/constants";

const PRICE = {
  mbti: 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo: 90_000,
} as const;

export const runtime = "edge";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Đọc input
  let { product, coupon: rawCode } = await req.json();
  product = (product ?? "").toLowerCase().trim();

  // 2. Tính amount_due cơ bản
  if (!(product in PRICE)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }
  let amount_due = PRICE[product as keyof typeof PRICE];

  // 2a. Với knowdell: tính theo combo
  if (product === "knowdell") {
    const { data: paidList } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", user.id)
      .eq("status", STATUS.PAID)
      .in("product", ["mbti", "holland"]);
    const sumPaid = (paidList ?? []).reduce((sum, r) => {
      return sum + (PRICE[r.product as keyof typeof PRICE] || 0);
    }, 0);
    // combo = 90k, đã đóng mbti+holland = sumPaid, còn lại
    amount_due = Math.max(0, PRICE.combo - sumPaid);
  }

  // 3. Xử lý coupon
  let discount = 0;
  let promo_code: string | null = null;
  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    if (
      !cpn ||
      (cpn.expires_at && new Date(cpn.expires_at) < now) ||
      (cpn.product && cpn.product !== product)
    ) {
      return NextResponse.json(
        { error: "Mã giảm giá không hợp lệ" },
        { status: 400 }
      );
    }
    discount = cpn.discount ?? 0;
    promo_code = code;
  }

  // 4. Tính final amount
  const amount = Math.max(0, amount_due - discount);

  // 5. Nếu amount === 0 → kích hoạt ngay, upsert thành paid
  if (amount === 0) {
    // upsert: nếu đã có pending hay paid thì update status thành paid + gán discount
    const record = {
      user_id: user.id,
      product,
      amount: 0,
      status: STATUS.PAID,
      promo_code,
      discount,
      updated_at: new Date().toISOString(),
    };
    await supabase
      .from("payments")
      .upsert(record, { onConflict: ["user_id", "product"] });
    return NextResponse.json({ free: true });
  }

  // 6. Tạo QR SePay cho thanh toán có phí
  const order_code = Math.random().toString(36).slice(-4).toUpperCase();
  const qr_desc = `SEVQR ${order_code}`;
  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC = process.env.SEPAY_BANK_ACC!;
  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}&acc=${BANK_ACC}` +
    `&amount=${amount}&des=${encodeURIComponent(qr_desc)}&template=compact`;

  // 7. Upsert bản ghi pending (nếu đã tồn tại thì update, else insert mới)
  const pendingData = {
    user_id: user.id,
    product,
    amount,
    status: STATUS.PENDING,
    promo_code,
    discount,
    order_code,
    qr_desc,
    updated_at: new Date().toISOString(),
  };
  await supabase
    .from("payments")
    .upsert(pendingData, { onConflict: ["user_id", "product"] });

  // 8. Trả về QR cho client
  return NextResponse.json({ amount, qr_url, order_code });
}
