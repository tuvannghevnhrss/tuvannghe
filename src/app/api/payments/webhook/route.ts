// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  // ví dụ body.content = "… SEVQR ABCD"
  const content: string = body.content || "";
  const m = content.match(/SEVQR\s+([A-Z0-9]{4})/);
  if (!m) {
    return NextResponse.json({ ok: false, error: "No order code" }, { status: 400 });
  }
  const code = m[1];

  // Dùng SERVICE_ROLE_KEY để update bảng payments
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("order_code", code);

  if (error) {
    console.error("Webhook update failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
