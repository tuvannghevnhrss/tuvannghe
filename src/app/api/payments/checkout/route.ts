import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "crypto";
import { PRICES, STATUS } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/settings/flags";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PRICE = PRICES;

const ORDER_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ORDER_CODE_LENGTH = 8;

/** Sinh order_code bằng crypto.randomBytes thay vì Math.random() — entropy
 * 36^8 (~2.8 nghìn tỷ tổ hợp) so với 36^4 (~1.68 triệu) trước đây. Ký tự
 * giới hạn A-Z0-9 để khớp với regex trích xuất ở webhook/route.ts và không
 * bị bank/SePay cắt/biến dạng khi nhét vào nội dung chuyển khoản. */
function generateOrderCode(): string {
  const bytes = randomBytes(ORDER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i++) {
    code += ORDER_CODE_ALPHABET[bytes[i] % ORDER_CODE_ALPHABET.length];
  }
  return code;
}

export async function POST(req: Request) {
  if (await isFeatureEnabled("maintenance_mode")) {
    return NextResponse.json(
      { error: "MAINTENANCE_MODE", message: "Hệ thống thanh toán đang bảo trì, vui lòng quay lại sau." },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product: rawProd, coupon: rawCode } = await req.json();
  const product = String(rawProd ?? "").toLowerCase().trim();

  if (product === "mbti") {
    await supabase.from("payments").upsert(
      {
        user_id: user.id,
        product: "mbti",
        amount: 0,
        amount_due: 0,
        discount: 0,
        status: STATUS.PAID,
      },
      { onConflict: "user_id,product" }
    );
    return NextResponse.json({ free: true });
  }

  const { data: paidBefore } = await supabase
    .from("payments")
    .select("product")
    .eq("user_id", user.id)
    .eq("status", STATUS.PAID);

  const has = (item: string) => (paidBefore ?? []).some((row) => row.product === item);

  let amount_due = PRICE[product as keyof typeof PRICE] ?? 0;

  if (product === "knowdell") {
    amount_due = has("holland") ? PRICE.knowdell : PRICE.combo;
  }

  if (product === "holland" && has("knowdell")) {
    return NextResponse.json({ free: true });
  }

  let discount = 0;
  let promo_code: string | null = null;
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
    if (
      coupon &&
      (!coupon.expires_at || new Date(coupon.expires_at) > now) &&
      (!coupon.product || coupon.product === product)
    ) {
      discount = coupon.discount ?? 0;
      promo_code = code;
    }
  }

  const amount = Math.max(0, amount_due - discount);

  if (amount === 0) {
    await supabase.from("payments").insert({
      user_id: user.id,
      product,
      amount,
      amount_due,
      discount,
      status: STATUS.PAID,
      promo_code,
    });

    if (product === "knowdell" && !has("holland")) {
      await supabase.from("payments").insert({
        user_id: user.id,
        product: "holland",
        amount: 0,
        amount_due: PRICE.holland,
        discount: PRICE.holland,
        status: STATUS.PAID,
        promo_code: "COMBO",
      });
    }
    return NextResponse.json({ free: true });
  }

  const order_code = generateOrderCode();
  const qr_desc = `SEVQR ${order_code}`;

  const { data: inserted, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      product,
      amount,
      amount_due,
      discount,
      status: STATUS.PENDING,
      order_code,
      qr_desc,
      promo_code,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Checkout insert error ➜", insertError);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }

  const qr_url =
    `https://qr.sepay.vn/img?bank=${process.env.SEPAY_BANK_CODE!}` +
    `&acc=${process.env.SEPAY_BANK_ACC!}` +
    `&amount=${amount}&des=${encodeURIComponent(qr_desc)}&template=compact`;

  // payment_id: định danh duy nhất của GIAO DỊCH này (khác với "product",
  // vốn chỉ trả lời "user đã từng mua sản phẩm chưa"). Frontend phải poll
  // trạng thái bằng payment_id này để không bị nhầm với 1 giao dịch cũ khác
  // đã paid trước đó của cùng product.
  return NextResponse.json({ amount, qr_url, order_code, payment_id: inserted.id });
}
