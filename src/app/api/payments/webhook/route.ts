// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STATUS } from "@/lib/constants";

/*  🔑  ĐỌC SERVICE-ROLE KEY  */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,      // phải set trên Vercel
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /* ── 1. Tách order_code (4 ký tự phía sau 'SEVQR') ─────────────── */
    const order_code: string | undefined =
      payload.description
        ?.toUpperCase()
        .match(/SEVQR\s+([A-Z0-9]{4})/)?.[1];

    if (!order_code) return NextResponse.json({ ok: false });

    /* ── 2. Tìm payment đang PENDING ──────────────────────────────── */
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_code", order_code)
      .eq("status", STATUS.PENDING)
      .maybeSingle();

    if (!payment) return NextResponse.json({ ok: false });

    /* ── 3. Cập nhật trạng thái ───────────────────────────────────── */
    await supabase
      .from("payments")
      .update({
        status      : STATUS.PAID,
        paid_at     : new Date(),
        amount_paid : payload.transferAmount ?? null,
      })
      .eq("id", payment.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook update error", err);
    return NextResponse.json({ ok: false });
  }
}
