// src/app/api/payments/status/route.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { STATUS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const paymentIdRaw = req.nextUrl.searchParams.get("payment_id");
  const paymentId = Number(paymentIdRaw);
  if (!paymentIdRaw || !Number.isFinite(paymentId)) {
    return NextResponse.json({ error: "PAYMENT_ID_REQUIRED", paid: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ paid: false });

  // PAYMENT TRANSACTION, không phải PRODUCT ENTITLEMENT: chỉ nhìn vào đúng
  // 1 giao dịch (payment_id) mà trang /payment hiện đang hiển thị QR, không
  // suy ra "paid" từ 1 giao dịch KHÁC (kể cả cùng product) đã paid trước đó.
  // Nếu user có Payment A (product=holland, paid) rồi tạo tiếp Payment B
  // (product=holland, pending), gọi /status?payment_id=B phải trả
  // paid:false cho tới khi CHÍNH Payment B được webhook đánh dấu paid —
  // không được fallback sang .eq("product", ...).eq("status","paid") để
  // xác nhận hộ giao dịch này.
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ paid: payment?.status === STATUS.PAID });
}
