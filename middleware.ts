// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { STATUS } from "@/lib/constants";

export const config = {
  matcher: ["/mbti/:path*", "/holland/:path*", "/knowdell/:path*"],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Chưa đăng nhập → ép về signup
    return NextResponse.redirect(new URL("/signup", req.url));
  }

  const user = session.user;
  // Xác định product từ url
  const path = req.nextUrl.pathname.startsWith("/mbti")
    ? "mbti"
    : req.nextUrl.pathname.startsWith("/holland")
    ? "holland"
    : "knowdell";

  // Lấy bản ghi thanh toán mới nhất có status = "paid"
  const { data: payments, error } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", path)
    .eq("status", STATUS.PAID)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Supabase error in middleware:", error);
    // Nếu gặp lỗi DB thì vẫn cho qua (hoặc redirect tuỳ ý)
    return res;
  }

  const paidRecord = payments?.[0] ?? null;
  if (!paidRecord) {
    // Chưa có record paid → ép về trang thanh toán
    return NextResponse.redirect(new URL(`/payment?product=${path}`, req.url));
  }

  // Đã paid → cho qua, tiếp tục vào quiz/result
  return res;
}
