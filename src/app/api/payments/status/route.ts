// src/app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ paid: false });
  }

  const url = new URL(req.url);
  const product = url.searchParams.get("product");
  if (!product) {
    return NextResponse.json({ paid: false });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .eq("user_id", user.id)
    .eq("product", product)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ paid: false });
  }

  return NextResponse.json({ paid: data?.status === "paid" });
}
