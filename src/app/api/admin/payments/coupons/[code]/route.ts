import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { deleteCoupon } from "@/lib/admin/services/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const auth = await requireAdmin("payments", "full");
  if (auth.error) return auth.error;

  const { code } = await params;

  try {
    await deleteCoupon(decodeURIComponent(code), auth.admin);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: err instanceof Error ? err.message : "" } },
      { status: 500 }
    );
  }
}
