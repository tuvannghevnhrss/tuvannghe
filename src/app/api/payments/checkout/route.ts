// src/app/api/payments/checkout/route.ts
import { NextResponse } from "next/server";
import { cookies }      from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SERVICE, STATUS } from "@/lib/constants";

const PRICE   = { mbti:10_000, holland:20_000, knowdell:100_000, combo:90_000 } as const;

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" },{ status:401 });

  /* ---- Lấy dữ liệu request ---- */
  const { product:rawProduct, coupon:rawCode } = await req.json();
  const product = (rawProduct as string).toLowerCase().trim() as keyof typeof PRICE;
  if (!PRICE[product]) return NextResponse.json({ error:"Invalid product" },{ status:400 });

  /* ---- Tính amount_due   ------------------------------------------ */
  let amount_due = PRICE[product];
  if (product === "knowdell") {
    const { data: paid } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", user.id)
      .eq("status", STATUS.PAID)
      .in("product", ["mbti", "holland"]);

    const already = (paid ?? []).reduce((s,r)=> s + PRICE[r.product as keyof typeof PRICE],0);
    amount_due = Math.max(0, PRICE.combo - already);
  }

  /* ---- Mã giảm giá ----------------------------------------------- */
  let discount   = 0;
  let promo_code = null as string | null;

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
      return NextResponse.json({ error:"Mã giảm giá không hợp lệ" },{ status:400 });
    }
    discount   = cpn.discount ?? 0;
    promo_code = code;
  }

  const amount = Math.max(0, amount_due - discount);

  /* ---- FREE → kích hoạt ngay -------------------------------------- */
  if (amount === 0) {
    await supabase.from("payments").insert({
      user_id   : user.id,          // ✅ KHÔNG còn user_id bị undefined
      product,
      amount,
      amount_due,
      discount,
      status    : STATUS.PAID,
    });
    return NextResponse.json({ free:true });
  }

  /* ---- Tạo QR SePay & lưu payment (pending) ----------------------- */
  const order_code = Math.random().toString(36).slice(-4).toUpperCase();
  const qr_desc    = `SEVQR ${order_code}`;

  await supabase.from("payments").insert({
    user_id   : user.id,
    product,
    amount,
    amount_due,
    discount,
    status    : STATUS.PENDING,
    order_code,
    qr_desc,
  });

  const BANK_CODE = process.env.SEPAY_BANK_CODE!;
  const BANK_ACC  = process.env.SEPAY_BANK_ACC!;
  const qr_url =
    `https://qr.sepay.vn/img?bank=${BANK_CODE}&acc=${BANK_ACC}` +
    `&amount=${amount}&des=${encodeURIComponent(qr_desc)}&template=compact`;

  return NextResponse.json({ amount, qr_url, order_code });
}
