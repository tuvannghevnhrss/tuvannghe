export const dynamic  = 'force-dynamic';
export const runtime  = 'nodejs';      // 👈
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const { code, score } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("holland_results")
    .upsert({ user_id: user.id, code, score });

  if (error)
    return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ status: "ok" });
}
