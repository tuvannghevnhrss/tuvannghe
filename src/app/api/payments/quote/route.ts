/* ------------------------------------------------------------------
   src/app/api/payments/quote/route.ts
   Trả về số tiền cần thanh toán sau khi áp dụng (nếu hợp lệ) mã giảm giá
   ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";        // luôn chạy dưới dạng Edge / server
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/* Bảng giá gốc (đồng) – thêm / sửa giá tại đây là đủ */
const PRICE = {
  mbti   : 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo  : 90_000,
} as const;

/* -------------------------------------------------- */
export async function GET(req: Request) {
  const url        = new URL(req.url);
  const productRaw = (url.searchParams.get("product") ?? "").toLowerCase();
  const codeRaw    = (url.searchParams.get("coupon")  ?? "").trim().toUpperCase();

  /* 1️⃣  Xác định giá gốc ------------------------------------------------ */
  const amount_due = PRICE[productRaw as keyof typeof PRICE] ?? 0;
  if (amount_due === 0) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  /* 2️⃣  Mặc định: không giảm giá */
  let discount = 0;

  /* 3️⃣  Nếu có mã thì tra bảng `coupons` -------------------------------- */
  if (codeRaw) {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: coupon } = await supabase
      .from("coupons")
      .select("discount, expires_at, product")
      .eq("code", codeRaw)
      .maybeSingle();

    /* 3a.  Kiểm tra điều kiện hợp lệ của coupon */
    if (
      coupon &&
      (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) &&      // chưa hết hạn
      (!coupon.product   || coupon.product === productRaw)                     // dùng cho sản phẩm này
    ) {
      discount = coupon.discount ?? 0;
    }
  }

  /* 4️⃣  Tính số tiền phải trả (không âm) -------------------------------- */
  const amount = Math.max(0, amount_due - discount);

  /* 5️⃣  Trả về cho client */
  return NextResponse.json({ amount_due, discount, amount });
}
