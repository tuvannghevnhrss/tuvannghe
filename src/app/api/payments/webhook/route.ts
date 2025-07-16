// src/app/api/payments/webhook/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { STATUS } from "@/lib/constants";

export async function POST(req: Request) {
  /* KHỞI TẠO Ở ĐÂY – chỉ chạy khi WebHook thực sự được gọi */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,      // service-role key
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const order_code = body.description?.toUpperCase()
                       .match(/SEVQR\s+([A-Z0-9]{4})/)?.[1];
    if (!order_code) return NextResponse.json({ ok:false });

    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_code", order_code)
      .eq("status", STATUS.PENDING)
      .maybeSingle();

    if (!payment) return NextResponse.json({ ok:false });

    await supabase
      .from("payments")
      .update({
        status      : STATUS.PAID,
        paid_at     : new Date(),
        amount_paid : body.transferAmount ?? null,
      })
      .eq("id", payment.id);

    return NextResponse.json({ ok:true });
  } catch (err) {
    console.error("Webhook update error", err);
    return NextResponse.json({ ok:false });
  }
}
