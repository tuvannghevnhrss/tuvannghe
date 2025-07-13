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

/* ------------------------------------------------------------------ */
async function buildQuote(productRaw: string, codeRaw: string) {
  const product = productRaw.toLowerCase().trim();
  if (!(product in PRICE)) return { error: "Invalid product" } as const;

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "unauth" } as const;

  /* 1 ▸ Tính amount_due */
  let amount_due = PRICE[product as keyof typeof PRICE];

  // Nếu là knowdell → phần còn thiếu để đủ combo 90K
  if (product === "knowdell") {
    const { data: paid } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", session.user.id)
      .eq("status", "PAID")
      .in("product", ["mbti", "holland"]);

    const already = paid?.reduce(
      (s, r) => s + PRICE[r.product as keyof typeof PRICE],
      0
    ) ?? 0;

    amount_due = Math.max(0, PRICE.combo - already);
  }

  /* 2 ▸ Giảm giá theo coupon */
  let discount = 0;
  if (codeRaw) {
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, expires_at, product")
      .eq("code", codeRaw.trim().toUpperCase())
      .maybeSingle();

    const now = new Date();
    if (
      cpn &&
      (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
      (!cpn.product || cpn.product === product)
    ) {
      discount = cpn.discount ?? 0;
    } else {
      return { error: "Mã giảm giá không hợp lệ" } as const;
    }
  }

  return {
    listPrice : PRICE[product as keyof typeof PRICE],
    amount_due,
    discount,
    amount    : Math.max(0, amount_due - discount),
  } as const;
}

/* ---------------- GET / POST ---------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.json(
    await buildQuote(
      url.searchParams.get("product") ?? "",
      url.searchParams.get("coupon")  ?? "",
    )
  );
}

export async function POST(req: Request) {
  const { product = "", coupon = "" } = await req.json();
  return NextResponse.json(await buildQuote(product, coupon));
}
