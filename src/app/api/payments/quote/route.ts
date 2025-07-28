/* ------------------------------------------------------------------
   GET  /api/payments/quote
   ▸ Tính số tiền phải trả (đã trừ combo / coupon)
   ▸ Nếu user đã mua Knowdell → Holland auto-paid
------------------------------------------------------------------ */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const PRICE = {
  mbti    : 0,        // luôn miễn phí
  holland : 20_000,
  knowdell: 100_000,  // giá gốc – mua kèm Holland = combo
  combo   : 90_000,
} as const;

/* --------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  /* 1. Kiểm tra đăng nhập */
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* 2. Lấy tham số */
  const rawProduct = (req.nextUrl.searchParams.get("product") ?? "").toLowerCase();
  const couponCode = (req.nextUrl.searchParams.get("coupon")  ?? "").trim().toUpperCase();
  if (!(rawProduct in PRICE)) {
    return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
  }
  const product = rawProduct as keyof typeof PRICE;

  /* 3. Truy vấn các khoản đã thanh toán của user (không phụ thuộc hoa-thường) */
  const { data: payments } = await supabase
    .from("payments")
    .select("product, status")
    .eq("user_id", user.id);

  const paidSet = new Set(
    (payments ?? [])
      .filter(p => (p.status ?? "").toLowerCase() === "paid")
      .map(p => (p.product ?? "").toLowerCase()),
  );

  /* 4. MBTI luôn free */
  if (product === "mbti") {
    return NextResponse.json({
      listPrice: 0,
      amount_due: 0,
      discount:   0,
      amount:     0,
      paid:       true,
    });
  }

  /* 5. Tính giá niêm yết & số tiền phải trả */
  let listPrice  = PRICE[product];
  let amountDue  = listPrice;

  // ▸ Knowdell: nếu CHƯA có Holland → tính combo; ngược lại giữ giá gốc
  if (product === "knowdell" && !paidSet.has("holland")) {
    listPrice = PRICE.combo;
    amountDue = PRICE.combo;
  }

  // ▸ Holland: nếu ĐÃ có Knowdell → coi như đã thanh toán
  if (product === "holland" && paidSet.has("knowdell")) {
    return NextResponse.json({
      listPrice,
      amount_due: 0,
      discount:   listPrice,
      amount:     0,
      paid:       true,
    });
  }

  /* 6. Áp dụng coupon (nếu có) */
  let discount = 0;
  if (couponCode) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", couponCode)
      .maybeSingle();

    const now   = new Date();
    const valid = cpn &&
                  (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
                  (!cpn.product    || cpn.product.toLowerCase() === product);

    if (valid) discount = cpn.discount ?? 0;
  }

  /* 7. Kết quả */
  const amount = Math.max(0, amountDue - discount);

  return NextResponse.json({
    listPrice,
    amount_due: amountDue,
    discount,
    amount,
    paid: paidSet.has(product),          // đã thanh toán riêng sản phẩm này?
  });
}
