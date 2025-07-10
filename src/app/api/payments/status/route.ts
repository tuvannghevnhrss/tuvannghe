// src/app/api/payments/status/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  // 1. Khởi supabase trên server, lấy session từ cookie
  const supabase = createServerComponentClient({ cookies });

  // 2. Lấy user hiện tại
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ paid: false });
  }

  // 3. Đọc product từ query string: ?product=mbti
  const url = new URL(req.url);
  const product = url.searchParams.get('product');
  if (!product) {
    return NextResponse.json({ paid: false });
  }

  // 4. Tra bảng payments xem user đã có record thanh toán thành công chưa
  const { data, error } = await supabase
    .from('payments')
    .select('status')
    .eq('user_id', user.id)
    .eq('product', product)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ paid: false });
  }

  // 5. Nếu record tồn tại và status === 'paid' thì trả về paid: true
  return NextResponse.json({ paid: data?.status === 'paid' });
}
