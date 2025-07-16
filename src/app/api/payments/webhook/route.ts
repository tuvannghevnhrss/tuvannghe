/* src/app/api/payments/webhook/route.ts
   – Nhận callback từ SePay, xác thực & gạch nợ
----------------------------------------------------- */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STATUS } from "@/lib/constants";

export const runtime = "nodejs";           // !! dùng Node, không dùng Edge

type SePayPayload = {
  id: number;                    // mã giao dịch
  transferAmount: number;        // số tiền (đ)
  content?: string;              // “CT DEN:… SEVQR XXXX”
  description?: string;          // BankAPINotify … SEVQR XXXX
  qr_desc?: string;              // Nếu bạn cấu hình SePay trả về
  [key: string]: any;
};

export async function POST(req: Request) {
  /* ---------- 1. Xác thực webhook ---------- */
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const secretHeader = auth.startsWith("Apikey")
    ? auth.slice("Apikey".length).trim()
    : "";
  const secretEnv = (process.env.SEPAY_WEBHOOK_SECRET || "").trim();

  if (
    !secretHeader ||
    !secretEnv ||
    secretHeader.toLowerCase() !== secretEnv.toLowerCase()
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid secret" },
      { status: 401 }
    );
  }

  /* ---------- 2. Đọc payload ---------- */
  let body: SePayPayload;
  try {
    body = (await req.json()) as SePayPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  /* ---------- 3. Trích orderCode (4 ký tự) ---------- */
  const qr =
    body.qr_desc ||
    body.content?.match(/SEVQR[\s\-]*(\w{4})/)?.[0] ||
    body.description?.match(/SEVQR[\s\-]*(\w{4})/)?.[0] ||
    "";

  const code = qr.match(/([A-Z0-9]{4})$/)?.[1];
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Cannot find order_code" },
      { status: 400 }
    );
  }
  const qr_desc = `SEVQR ${code}`;

  /* ---------- 4. Kết nối Supabase ---------- */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);

  /* ---------- 5. Cập nhật bản ghi ---------- */
  const { error } = await supabase
    .from("payments")
    .update({
      status: STATUS.PAID,
      paid_at: new Date().toISOString(),
      amount_paid: body.transferAmount ?? null,
    })
    .eq("status", STATUS.PENDING)
    .eq("qr_desc", qr_desc);

  if (error) {
    console.error("Webhook update error ➜", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
