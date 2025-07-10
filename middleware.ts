import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = {
  matcher: ["/chat/:path*", "/mbti/:path*", "/holland/:path*"],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // KHÔNG được gọi getSession hoặc getUser ở đây nữa!
  await createMiddlewareClient({ req, res }); // Chỉ đồng bộ cookie
  return res;
}
