import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product, coupon } = await req.json();

  const PRICE = { mbti: 10_000, holland: 20_000, knowdell: 100_000, combo: 90_000 };
  let amount = PRICE[product as keyof typeof PRICE] ?? null;
  if (!amount) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  /* áp coupon */
  if (coupon) {
    const { data } = await supabase
      .from("coupons")
      .select("discount")
      .eq("code", coupon)
      .eq("product", product)          // 🎯 áp cho đúng sản phẩm
      .gte("expires_at", new Date().toISOString())
      .single();

    if (data) amount = Math.max(amount - data.discount, 0);
  }

  return NextResponse.json({ amount });
}
