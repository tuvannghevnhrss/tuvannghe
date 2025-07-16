// src/app/api/payments/webhook/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,          // luôn public
  process.env.SUPABASE_SERVICE_ROLE_KEY!,         // vừa thêm ở bước 1
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const secret = req.headers.get("x-sepay-signature") ?? "";
  if (secret !== process.env.SEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }

  const payload = await req.json();                     // { description: "... SEVQR AAIP", ... }
  const qrCode   = payload.description.match(/SEVQR (\w{4})/)?.[1]; // AAIP
  if (!qrCode) return NextResponse.json({ ok: false });

  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date(), amount_paid: payload.transferAmount })
    .eq("qr_desc", `SEVQR ${qrCode}`);

  return NextResponse.json({ ok: !error });
}
