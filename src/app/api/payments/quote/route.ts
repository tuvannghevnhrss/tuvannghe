/* ------------------------------------------------------------------
   GET /api/payments/quote
   ──────────────────────────────────────────────────────────────────
   • Trả thông tin thanh toán (đã-trả hay chưa, số tiền phải đóng)
   • Nếu người dùng đã trả Knowdell ⇒ Holland coi như “đã mua”
   • MBTI luôn miễn phí
   ------------------------------------------------------------------ */
import { NextRequest, NextResponse } from 'next/server';
import { cookies }                   from 'next/headers';
import { createRouteHandlerClient }  from '@supabase/auth-helpers-nextjs';
import { STATUS }                    from '@/lib/constants';

const PRICE = {
  mbti    : 0,          // luôn free
  holland : 20_000,
  knowdell: 100_000,    // giá lẻ
  combo   : 90_000,     // Knowdell + Holland
} as const;

type PriceKey = keyof typeof PRICE;

export async function GET(req: NextRequest) {
  /* ────────── 1. Auth ────────── */
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  /* ────────── 2. Params ────────── */
  const product = (req.nextUrl.searchParams.get('product') || '').toLowerCase() as PriceKey;
  const coupon  = (req.nextUrl.searchParams.get('coupon')  || '')
                    .trim()
                    .toUpperCase();

  if (!PRICE.hasOwnProperty(product))
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });

  /* ────────── 3. Đã thanh toán gì trước đó? ────────── */
  const { data: paidRows } = await supa
    .from('payments')
    .select('product')
    .eq('user_id', user.id)
    .eq('status', STATUS.PAID);

  const paidSet = new Set<string>((paidRows ?? []).map(r => r.product));

  /* rule bundle: Knowdell bao gồm Holland */
  const knowdellPaid = paidSet.has('knowdell');
  if (knowdellPaid) paidSet.add('holland');

  /* ────────── 4. Tính tiền ────────── */
  const listPrice = PRICE[product];

  /* combo giá “Knowdell nếu chưa có Holland” */
  let amount_due = listPrice;
  if (product === 'knowdell' && !paidSet.has('holland')) {
    amount_due = PRICE.combo;
  }

  /* Holland đã bao gồm trong Knowdell combo ⇒ 0 đ */
  if (product === 'holland' && knowdellPaid) {
    amount_due = 0;
  }

  /* ── coupon (tuỳ chọn) ── */
  let discount = 0;
  if (coupon) {
    const { data: cpn } = await supa
      .from('coupons')
      .select('discount, product, expires_at')
      .eq('code', coupon)
      .maybeSingle();

    const now = new Date();
    const valid =
      cpn &&
      (!cpn.expires_at || new Date(cpn.expires_at) > now) &&
      (!cpn.product || cpn.product === product);

    if (valid) discount = cpn!.discount ?? 0;
  }

  const amount = Math.max(0, amount_due - discount);
  const paid   = paidSet.has(product);

  /* ────────── 5. Response ────────── */
  return NextResponse.json({
    listPrice,
    amount_due,
    discount,
    amount,
    paid,
  });
}
