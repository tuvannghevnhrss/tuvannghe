import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/chat/:path*", "/mbti/:path*", "/holland/:path*"],
};

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}
