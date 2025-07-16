// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { STATUS } from "@/lib/constants";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;   // <- thêm env
const SIGN_HEADER   = "x-sepay-signature";
const SIGN_SECRET   = process.env.SEPAY_WEBHOOK_SECRET!;

// init once
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get(SIGN_HEADER) ?? "";

  /* ── verify ───────────────────────── */
  const hash = crypto.createHmac("sha256", SIGN_SECRET).update(raw).digest("hex");
  if (hash !== sig) return NextResponse.json({ ok: false }, { status: 403 });

  /* ── parse ────────────────────────── */
  interface SePayEvent {
    description: string;         // “… SEVQR XBG0”
    transferAmount: number;      // 2000
    id: number;                  // 17840015 (transaction id)
  }
  const ev = JSON.parse(raw) as SePayEvent;

  // Lấy code 4 ký tự cuối sau ‘SEVQR ’
  const m = /SEVQR\s+([A-Z0-9]{4})/.exec(ev.description ?? "");
  if (!m) return NextResponse.json({ ok: false, err: "no code" });

  const code = m[1];             // eg: XBG0

  /* ── update ───────────────────────── */
  const { error } = await admin
    .from("payments")
    .update({
      status      : STATUS.PAID,
      amount_paid : ev.transferAmount,
      paid_at     : new Date().toISOString(),
    })
    .eq("order_code", code)      // <-- cột order_code có 4 ký tự QR
    .eq("status",    STATUS.PENDING);

  if (error) return NextResponse.json({ ok: false, err: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
