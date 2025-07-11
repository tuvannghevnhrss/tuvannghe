import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();

  /* 👛 Bảng giá gốc */
  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };
  const amount_due = PRICE[product as keyof typeof PRICE];
  if (!amount_due) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* 🔎 Kiểm tra coupon */
  let discount = 0;
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select("discount,expires_at,product")
      .eq("code", coupon)
      .maybeSingle();

    const now = new Date();
    if (
      data &&
      new Date(data.expires_at) >= now &&
      (!data.product || data.product === product)
    ) {
      discount = data.discount;
    }
  }

  const amount = Math.max(amount_due - discount, 0);
  return NextResponse.json({ amount, discount });
}
