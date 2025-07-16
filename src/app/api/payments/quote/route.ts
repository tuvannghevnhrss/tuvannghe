/* ------------------------------------------------------------------
   GET | POST /api/payments/quote
   • Trả về số tiền phải trả sau khi trừ phần combo đã mua
   • Áp dụng mã giảm giá (nếu hợp lệ)
   ------------------------------------------------------------------ */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { STATUS } from "@/lib/constants";

const PRICE = {
  mbti    : 0,          // MBTI luôn free
  holland : 20_000,
  knowdell: 100_000,    // giá gốc – sẽ điều chỉnh thành combo nếu cần
  combo   : 90_000,
} as const;

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }} = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = (req.nextUrl.searchParams.get("product") ?? "").toLowerCase();
  const coupon  = (req.nextUrl.searchParams.get("coupon")  ?? "").trim().toUpperCase();

  /* ---------- MBTI luôn free ---------- */
  if (product === "mbti") {
    return NextResponse.json({ listPrice: 0, amount_due: 0, discount: 0,
                               amount: 0, paid: true });
  }

  /* ---------- kiểm tra thanh toán trước đó ---------- */
  const { data: paidBefore } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", STATUS.PAID);

  const alreadyPaid = new Set((paidBefore ?? []).map(r => r.product));

  /* ---------- tính amount_due ---------- */
  let amount_due = PRICE[product as keyof typeof PRICE] ?? 0;

  if (product === "knowdell") {
    // combo nếu CHƯA có Holland
    amount_due = alreadyPaid.has("holland") ? PRICE.knowdell : PRICE.combo;
  }

  if (product === "holland" && alreadyPaid.has("knowdell")) {
    // Holland đã được “tặng” trong combo
    return NextResponse.json({ listPrice: PRICE.holland, amount_due: 0,
                               discount: PRICE.holland, amount: 0, paid: true });
  }

  /* ----- coupon (tuỳ biến, giữ nguyên nếu bạn có bảng coupons) ----- */
  let discount = 0;
  if (coupon) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", coupon)
      .maybeSingle();

    const now = new Date();
    if (cpn &&
        (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
        (!cpn.product    || cpn.product === product)) {
      discount = cpn.discount ?? 0;
    }
  }

  const amount = Math.max(0, amount_due - discount);
  const paid   = alreadyPaid.has(product);

  return NextResponse.json({
    listPrice: PRICE[product as keyof typeof PRICE] ?? 0,
    amount_due,
    discount,
    amount,
    paid,
  });
}
