import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { markPaymentPaid } from "@/lib/admin/services/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("payments", "full");
  if (auth.error) return auth.error;

  const { id } = await params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) {
    return NextResponse.json({ error: { code: "INVALID_ID" } }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const payment = await markPaymentPaid(paymentId, auth.admin, typeof body?.note === "string" ? body.note : undefined);
    return NextResponse.json({ data: payment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    const status = message === "PAYMENT_NOT_FOUND" ? 404 : message === "ALREADY_PAID" ? 409 : 500;
    return NextResponse.json({ error: { code: message } }, { status });
  }
}
