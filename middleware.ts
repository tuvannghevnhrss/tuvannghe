// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient }    from "@supabase/ssr";
import { STATUS } from "@/lib/constants";

/* --------------------------------------------------------
 * 1) Áp dụng cho MỌI request (trừ file tĩnh, _next, favicon)
 *    – để cookie luôn được refresh, kể cả /api/**
 * ------------------------------------------------------ */
export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.).*)"],
};

export async function middleware(req: NextRequest) {
  /* ---------------------------------------------------- *
   * Tạo response trước, rồi inject Supabase vào
   * ---------------------------------------------------- */
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  /* ❶ Refresh (hoặc lấy) session – hàm này có thể
       tạo mới cookie sb-…-auth-token khi token sắp hết hạn */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  /* ❷ QUAN TRỌNG: copy mọi cookie Supabase mới set sang res  
       (nếu bỏ dòng này – cookie không về được trình duyệt) */
  res.cookies.setAll(res.cookies.getAll());

  /* ---------- Phần kiểm tra thanh toán cũ của bạn -------- */
  if (!session) {
    return NextResponse.redirect(new URL("/signup", req.url));
  }

  const user = session.user;
  const path = req.nextUrl.pathname.startsWith("/mbti")
    ? "mbti"
    : req.nextUrl.pathname.startsWith("/holland")
    ? "holland"
    : req.nextUrl.pathname.startsWith("/knowdell")
    ? "knowdell"
    : null;

  if (path) {
    const { data: payment, error } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", user.id)
      .eq("product", path)
      .eq("status", STATUS.PAID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching payment in middleware:", error);
      return res;          // cho qua nhưng log lỗi
    }

    if (!payment) {
      return NextResponse.redirect(
        new URL(`/payment?product=${path}`, req.url)
      );
    }
  }

  return res;
}
