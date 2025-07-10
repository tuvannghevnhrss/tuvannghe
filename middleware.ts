import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

/* Các route cần đăng nhập */
export const config = {
  matcher: ["/chat/:path*", "/mbti/:path*", "/holland/:path*"],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Lấy user hiện tại
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirect = req.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  return res;
}
