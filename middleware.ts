// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = { matcher: ["/mbti/:path*", "/holland/:path*", "/knowdell/:path*"] };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/signup", req.url));
  }
  const user = session.user;
  const path = req.nextUrl.pathname.startsWith("/mbti")
    ? "mbti"
    : req.nextUrl.pathname.startsWith("/holland")
    ? "holland"
    : "knowdell";

  const { data: payment } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", path)
    .eq("status", STATUS.PAID)
    .maybeSingle();

  if (!payment) {
    return NextResponse.redirect(new URL(`/payment?product=${path}`, req.url));
  }
  return res;
}
