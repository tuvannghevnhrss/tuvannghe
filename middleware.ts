import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = {
  matcher: ["/chat/:path*", "/mbti/:path*", "/holland/:path*"],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // KHÔNG gọi getSession hoặc getUser ở đây!
  await createMiddlewareClient({ req, res }); // chỉ để sync cookie!
  return res;
}
