/* src/app/api/payments/webhook/route.ts
   – Nhận callback từ SePay, xác thực & gạch nợ
----------------------------------------------------- */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
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

/** So sánh 2 chuỗi bằng thời gian không đổi (không phụ thuộc độ dài phần
 * khớp) — tránh timing attack khi so sánh secret. Không throw khi 2 chuỗi
 * lệch độ dài (Buffer.compare/timingSafeEqual gốc sẽ throw trong trường hợp
 * này nếu không tự kiểm tra trước). */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), "utf8");
  const bufB = Buffer.from(b.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  /* ---------- 1. Xác thực webhook (timing-safe) ---------- */
  const auth =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const secretHeader = auth.startsWith("Apikey")
    ? auth.slice("Apikey".length).trim()
    : "";
  const secretEnv = (process.env.SEPAY_WEBHOOK_SECRET || "").trim();

  if (!secretHeader || !secretEnv || !timingSafeStringEqual(secretHeader, secretEnv)) {
    return NextResponse.json(
      { ok: false, error: "Invalid secret" },
      { status: 401 }
    );
  }

  /* ---------- 2. Đọc + validate payload ---------- */
  let body: SePayPayload;
  try {
    body = (await req.json()) as SePayPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const transferAmount = body.transferAmount;
  if (typeof transferAmount !== "number" || !Number.isFinite(transferAmount) || transferAmount <= 0) {
    return NextResponse.json(
      { ok: false, error: "Invalid transferAmount" },
      { status: 400 }
    );
  }

  /* ---------- 3. Trích orderCode (4-8 ký tự) ----------
     order_code mới dài 8 ký tự (crypto-random, xem checkout/route.ts), nhưng
     vẫn phải khớp được order_code cũ dài 4 ký tự — có payment "pending" tạo
     từ trước khi đổi format, webhook phải tiếp tục nhận diện được chúng khi
     user thanh toán, không được coi là "phá order hiện có". */
  const qr =
    body.qr_desc ||
    body.content?.match(/SEVQR[\s\-]*(\w{4,8})/)?.[0] ||
    body.description?.match(/SEVQR[\s\-]*(\w{4,8})/)?.[0] ||
    "";

  const code = qr.match(/([A-Z0-9]{4,8})$/)?.[1];
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

  /* ---------- 5. Tìm đúng payment pending khớp qr_desc ---------- */
  const { data: pendingPayment, error: findError } = await supabase
    .from("payments")
    .select("id, amount")
    .eq("status", STATUS.PENDING)
    .eq("qr_desc", qr_desc)
    .maybeSingle();

  if (findError) {
    console.error("Webhook lookup error ➜", findError);
    return NextResponse.json({ ok: false, error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }

  // Không còn payment pending khớp order_code này (đã paid từ trước, hoặc
  // order_code không tồn tại) — coi là no-op, trả 2xx để SePay không retry
  // vô hạn. Đây cũng là cơ chế idempotent cho webhook gửi lại nhiều lần.
  if (!pendingPayment) {
    return NextResponse.json({ ok: true, note: "NO_MATCHING_PENDING_PAYMENT" });
  }

  // Số tiền chuyển khoản phải đủ số tiền cần thanh toán — chặn trường hợp
  // chuyển thiếu vẫn bị đánh dấu paid đầy đủ quyền lợi.
  if (transferAmount < pendingPayment.amount) {
    console.error(
      `Webhook underpayment ➜ order ${qr_desc} expected ${pendingPayment.amount}, got ${transferAmount}`
    );
    return NextResponse.json({ ok: false, error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  /* ---------- 6. Cập nhật bản ghi ---------- */
  const { error } = await supabase
    .from("payments")
    .update({
      status: STATUS.PAID,
      paid_at: new Date().toISOString(),
      amount_paid: transferAmount,
    })
    .eq("id", pendingPayment.id)
    .eq("status", STATUS.PENDING);

  if (error) {
    console.error("Webhook update error ➜", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
