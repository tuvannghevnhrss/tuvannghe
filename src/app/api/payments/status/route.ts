// src/app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Kiểm tra xem user hiện tại đã thanh toán gói {product} hay chưa
 * GET /api/payments/status?product=mbti
 * → { paid: true | false }
 */
export async function GET(req: Request) {
  /* 1. Khởi Supabase trên server, kèm cookie */
  const supabase = createRouteHandlerClient({ cookies });

  /* 2. Lấy user hiện tại */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ paid: false });

  /* 3. Lấy product từ query string */
  const url     = new URL(req.url);
  const product = url.searchParams.get("product");
  if (!product) return NextResponse.json({ paid: false });

  /* 4. Tra bảng payments (bản ghi mới nhất) */
  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", product)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Status-check error:", error);
    return NextResponse.json({ paid: false });
  }

  /* 5. Trả kết quả */
  return NextResponse.json({ paid: data?.status === "paid" });
}
