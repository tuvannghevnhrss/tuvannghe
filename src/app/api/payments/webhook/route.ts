// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STATUS } from "@/lib/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,            // service-role key
  { auth:{ persistSession:false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();        // JSON SePay gửi sang
    const desc = (body.description as string)?.toUpperCase();  // “... SEVQR XXXX”

    const order_code = desc?.match(/SEVQR\s+([A-Z0-9]{4})/)?.[1];
    if (!order_code) return NextResponse.json({ ok:false });

    // Tìm payment đang PENDING
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_code", order_code)
      .eq("status", STATUS.PENDING)
      .maybeSingle();

    if (error || !payment) return NextResponse.json({ ok:false });

    // Cập nhật đã trả
    await supabase
      .from("payments")
      .update({ status: STATUS.PAID, paid_at: new Date(), amount_paid: body.transferAmount })
      .eq("id", payment.id);

    return NextResponse.json({ ok:true });
  } catch (err) {
    console.error("Webhook update error", err);
    return NextResponse.json({ ok:false });
  }
}
