// src/app/api/payments/webhook/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // bypass RLS
  { auth: { persistSession: false } }       // webhook -> không lưu cookie
);

export async function POST(req: Request) {
  // 1. Xác thực chữ ký SePay (nếu bạn dùng secret header)
  const secret = req.headers.get('x-sepay-secret');
  if (secret !== process.env.SEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
  }

  // 2. Đọc payload
  const body = await req.json();
  const desc: string = body.description || body.content || '';
  const code = desc.match(/SEVQR\s+([A-Z0-9]{4})/)?.[1];
  const amount = Number(body.transferAmount || 0);

  if (!code) {
    return NextResponse.json({ ok: false, error: 'order_code not found' }, { status: 400 });
  }

  // 3. Cập nhật payment
  const { error } = await supabase
    .from('payments')
    .update({ status: 'paid', paid_at: new Date(), amount_paid: amount })
    .eq('order_code', code)
    .is('paid_at', null);          // tránh update lặp

  if (error) {
    console.error('Webhook update error', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// Vercel Edge runtime không cần GET
export const runtime = 'edge';
