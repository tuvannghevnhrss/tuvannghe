// src/app/api/payments/status/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";
import { STATUS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product");
  if (!product) return NextResponse.json({ paid: false });

  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ paid: false });

  const { data } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", product)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ paid: data?.status === STATUS.PAID });
}
