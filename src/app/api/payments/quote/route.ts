/* ------------------------------------------------------------------
   GET | POST /api/payments/quote
   • Trả về số tiền phải trả sau khi trừ phần combo đã mua
   • Áp dụng mã giảm giá (nếu hợp lệ)
   ------------------------------------------------------------------ */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import {
  SERVICE,
  PRICES,
  STATUS,
  comboOutstanding,
} from "@/lib/constants";

type QuoteOk = {
  listPrice : number;
  amount_due: number;
  discount  : number;
  amount    : number;
};

type QuoteErr = { error: string };

/* ------------------------------------------------------------------ */
async function buildQuote(
  productRaw: string,
  codeRaw   : string
): Promise<QuoteOk | QuoteErr> {
  const product = productRaw.toLowerCase().trim();
  if (!(product in PRICES)) return { error: "Invalid product" };

  /* 1 ▸ xác thực */
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "unauth" };

  /* 2 ▸ tính amount_due (niêm yết) */
  let amount_due = PRICES[product as keyof typeof PRICES];

  /* — nếu product = knowdell → phần còn thiếu của combo — */
  if (product === SERVICE.KNOWDELL) {
    const { data: paidRows } = await supabase
      .from("payments")
      .select("product")
      .eq("user_id", session.user.id)
      .eq("status", STATUS.PAID);

    const alreadyPaidProducts =
      paidRows?.map(r => r.product as string) ?? [];

    amount_due = comboOutstanding(alreadyPaidProducts);
  }

  /* 3 ▸ áp dụng coupon */
  let discount = 0;

  if (codeRaw) {
    const code = codeRaw.trim().toUpperCase();
    const { data: cpn } = await supabase
      .from("coupons")
      .select("discount, expires_at, product")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    const valid =
      cpn &&
      (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
      (!cpn.product || cpn.product === product);

    if (!valid) return { error: "Mã giảm giá không hợp lệ" };

    discount = cpn!.discount ?? 0;
  }

  return {
    listPrice : PRICES[product as keyof typeof PRICES],
    amount_due,
    discount,
    amount    : Math.max(0, amount_due - discount),
  };
}

/* -------------------- GET -------------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") ?? "";
  const coupon  = url.searchParams.get("coupon")  ?? "";
  const data = await buildQuote(product, coupon);
  return NextResponse.json(data);
}

/* -------------------- POST ------------------- */
export async function POST(req: Request) {
  const { product = "", coupon = "" } = await req.json();
  const data = await buildQuote(product, coupon);
  return NextResponse.json(data);
}
