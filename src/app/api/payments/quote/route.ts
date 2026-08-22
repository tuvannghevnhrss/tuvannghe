import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PRICES, STATUS } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PRICE = PRICES;

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = (req.nextUrl.searchParams.get("product") ?? "").toLowerCase() as keyof typeof PRICE;
  const rawCode = req.nextUrl.searchParams.get("coupon");

  if (!Object.hasOwn(PRICE, product)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const { data: paidRows } = await supa
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", STATUS.PAID);

  const paidSet = new Set<string>((paidRows ?? []).map((row) => row.product));
  const knowdellPaid = paidSet.has("knowdell");
  if (knowdellPaid) paidSet.add("holland");

  const listPrice = PRICE[product];

  let amount_due = listPrice;
  if (product === "knowdell" && !paidSet.has("holland")) {
    amount_due = PRICE.combo;
  }

  if (product === "holland" && knowdellPaid) {
    amount_due = 0;
  }

  let discount = 0;
  if (rawCode?.trim()) {
    const code = rawCode.trim().toUpperCase();
    // coupons chỉ đọc được qua service-role (RLS chặn anon/authenticated qua
    // PostgREST) — tra cứu 1 mã cụ thể không cần và không nên đi qua client
    // theo session của user. Không đổi gì khác trong route này.
    const { data: coupon } = await createSupabaseAdminClient()
      .from("coupons")
      .select("discount, product, expires_at")
      .eq("code", code)
      .maybeSingle();

    const now = new Date();
    const valid =
      coupon &&
      (!coupon.expires_at || new Date(coupon.expires_at) > now) &&
      (!coupon.product || coupon.product === product);

    if (valid) discount = coupon.discount ?? 0;
  }

  const amount = Math.max(0, amount_due - discount);
  const paid = paidSet.has(product);

  return NextResponse.json({
    listPrice,
    amount_due,
    discount,
    amount,
    paid,
  });
}
