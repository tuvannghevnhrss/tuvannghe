/* ------------------------------------------------------------------
   Trả về số tiền phải trả sau khi áp dụng (nếu hợp lệ) mã coupon
   Hỗ trợ     – GET   /api/payments/quote?product=mbti&coupon=ZA80
            – POST  /api/payments/quote  { product, coupon }
   ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/* Bảng giá gốc (đồng) */
const PRICE = {
  mbti   : 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo  : 90_000,
} as const;

/* -------------------------------------------------- */
// chia thành hàm dùng chung
async function buildQuote(
  productRaw: string,
  codeRaw   : string
) {
  const product = productRaw.toLowerCase().trim();
  const amount_due = PRICE[product as keyof typeof PRICE] ?? 0;
  if (amount_due === 0) {
    return { error: "Invalid product" } as const;
  }

  let discount = 0;

  if (codeRaw) {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, expires_at, product")
      .eq("code", codeRaw.toUpperCase())
      .maybeSingle();

    const now = new Date();

    if (
      cpn &&
      (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
      (!cpn.product    || cpn.product === product)
    ) {
      discount = cpn.discount ?? 0;
    }
  }

  const amount = Math.max(0, amount_due - discount);
  return { amount_due, discount, amount } as const;
}

/* ---------- GET -------------------------------------------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") ?? "";
  const coupon  = url.searchParams.get("coupon")  ?? "";
  const data = await buildQuote(product, coupon);
  return NextResponse.json(data);
}

/* ---------- POST ------------------------------------------------- */
export async function POST(req: Request) {
  const { product = "", coupon = "" } = await req.json();
  const data = await buildQuote(product, coupon);
  return NextResponse.json(data);
}
