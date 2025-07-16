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
    return NextResponse.redirect(new URL("/signup", req.url));
  }

  const user = session.user;
  const path = req.nextUrl.pathname.startsWith("/mbti")
    ? "mbti"
    : req.nextUrl.pathname.startsWith("/holland")
    ? "holland"
    : "knowdell";

  // Chỉ lấy 1 record có status = "paid"
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("product", path)
    .eq("status", STATUS.PAID)
    .maybeSingle();     // or .single() nếu bạn chắc chắn chỉ có 0 hoặc 1 bản ghi

  if (error) {
    console.error("Error fetching payment in middleware:", error);
    return res;
  }
  if (!payment) {
    return NextResponse.redirect(
      new URL(`/payment?product=${path}`, req.url)
    );
  }

  return res;
}
