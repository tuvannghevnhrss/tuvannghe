// src/app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 🚩 Ghi lại toàn bộ header & body lần đầu để xác định định dạng SePay
  const headers = Object.fromEntries(req.headers.entries());
  const body    = await req.text();            // giữ nguyên chuỗi gốc để verify HMAC

  console.log('=== SePay webhook ===');
  console.log('Headers:', headers);            // <- Nhìn log để biết chính xác tên header
  console.log('Raw body:', body.slice(0, 300)); // in 300 ký tự đầu để tránh log quá dài

  return NextResponse.json({ ok: true });
}
