/* ------------------------------------------------------------------
   Trả về số tiền phải trả sau khi áp dụng coupon
   + trừ đi phần đã mua lẻ cho combo *hoặc* khi product = knowdell
   ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const PRICE = {
  mbti: 10_000,
  holland: 20_000,
  knowdell: 100_000,
  combo: 90_000,
} as const;

const PARTS = ["mbti", "holland", "knowdell"] as const;

/* -------------------------------------------------- */
async function buildQuote(productRaw: string, codeRaw: string) {
  const product = productRaw.toLowerCase().trim();
  if (!PRICE[product as keyof typeof PRICE])
    return { error: "Invalid product" } as const;

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "unauth" } as const;

  /* 1 ▸ tính amount_due */
  let amount_due = PRICE[product as keyof typeof PRICE];

  // ⟵ phần combo còn thiếu
  if (product === "combo" || product === "knowdell") {
    const { data: paidRows } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", session.user.id)
      .eq("status", "PAID")
      .in("product", PARTS);

    const already = paidRows?.reduce(
      (s, r) => s + PRICE[r.product as keyof typeof PRICE],
      0
    ) ?? 0;

    amount_due = Math.max(0, PRICE.combo - already);
  }

  /* 2 ▸ áp dụng coupon */
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
      (!cpn.product || cpn.product === product)
    ) {
      discount = cpn.discount ?? 0;
    }
  }

  return {
    listPrice: PRICE[product as keyof typeof PRICE],
    amount_due,
    discount,
    amount: Math.max(0, amount_due - discount),
  } as const;
}

/* ---------------- GET ---------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const p   = url.searchParams.get("product") ?? "";
  const cpn = url.searchParams.get("coupon")  ?? "";
  return NextResponse.json(await buildQuote(p, cpn));
}

/* ---------------- POST --------------- */
export async function POST(req: Request) {
  const { product = "", coupon = "" } = await req.json();
  return NextResponse.json(await buildQuote(product, coupon));
}
