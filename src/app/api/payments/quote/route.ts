/* ------------------------------------------------------------------
   Trả về số tiền phải trả sau khi áp dụng coupon
   và trừ đi khoản user đã mua lẻ (trường hợp product = combo)
   ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/* Bảng giá gốc (đồng) */
const PRICE = {
  mbti    : 10_000,
  holland : 20_000,
  knowdell: 100_000,
  combo   : 90_000,
} as const;

/* 🔹 NEW: thành phần cấu thành combo */
const COMBO_PARTS = ["mbti", "holland", "knowdell"] as const;

/* -------------------------------------------------- */
async function buildQuote(productRaw: string, codeRaw: string) {
  const product = productRaw.toLowerCase().trim();
  const listPrice = PRICE[product as keyof typeof PRICE] ?? 0;
  if (listPrice === 0) return { error: "Invalid product" } as const;

  /* 🔹 NEW: khởi tạo Supabase một lần (cần cho cả combo lẫn coupon) */
  const supabase = createRouteHandlerClient({ cookies });

  /* --------------------------------------------------
     1) Nếu user mua COMBO, trừ đi phần đã thanh toán lẻ
  -------------------------------------------------- */
  let amount_due = listPrice; // mặc định
  if (product === "combo") {
    const {
      data: paidRows,
    } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", (await supabase.auth.getSession()).data.session?.user.id)
      .eq("status", "PAID")
      .in("product", COMBO_PARTS);

    const alreadyPaid = paidRows?.reduce(
      (sum, row) => sum + PRICE[row.product as keyof typeof PRICE],
      0,
    ) ?? 0;

    amount_due = Math.max(0, listPrice - alreadyPaid);
  }

  /* --------------------------------------------------
     2) Tính discount nếu có coupon hợp lệ
  -------------------------------------------------- */
  let discount = 0;
  if (codeRaw) {
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
  return { listPrice, amount_due, discount, amount } as const;
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
