import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { listCoupons, upsertCoupon } from "@/lib/admin/services/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin("payments", "view");
  if (auth.error) return auth.error;

  try {
    const coupons = await listCoupons();
    return NextResponse.json({ data: coupons });
  } catch (err) {
    return NextResponse.json(
      { error: { code: "LIST_FAILED", message: err instanceof Error ? err.message : "" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("payments", "full");
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  const discount = Number(body?.discount ?? 0);

  if (!code || !Number.isFinite(discount) || discount < 0) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 422 });
  }

  try {
    const coupon = await upsertCoupon(
      { code, discount, product: body?.product || null, expiresAt: body?.expiresAt || null },
      auth.admin
    );
    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { code: "SAVE_FAILED", message: err instanceof Error ? err.message : "" } },
      { status: 500 }
    );
  }
}
