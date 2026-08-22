import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { AdminIdentity } from "@/lib/admin/getAdminUser";

export type PaymentRow = {
  id: number;
  userId: string;
  product: string;
  amount: number;
  amountDue: number;
  discount: number;
  status: string;
  orderCode: string | null;
  promoCode: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function listPayments(filters: {
  status?: string;
  product?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ payments: PaymentRow[]; total: number }> {
  const supabase = createSupabaseAdminClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;

  let query = supabase
    .from("payments")
    .select("id, user_id, product, amount, amount_due, discount, status, order_code, promo_code, created_at, paid_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.product) query = query.eq("product", filters.product);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    payments: ((data ?? []) as any[]).map((p) => ({
      id: p.id,
      userId: p.user_id,
      product: p.product,
      amount: p.amount,
      amountDue: p.amount_due,
      discount: p.discount,
      status: p.status,
      orderCode: p.order_code,
      promoCode: p.promo_code,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    })),
    total: count ?? 0,
  };
}

export async function markPaymentPaid(paymentId: number, admin: AdminIdentity, note?: string): Promise<PaymentRow> {
  const supabase = createSupabaseAdminClient();

  const { data: before, error: beforeErr } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (beforeErr) throw new Error(beforeErr.message);
  if (!before) throw new Error("PAYMENT_NOT_FOUND");
  if ((before as any).status === "paid") throw new Error("ALREADY_PAID");

  const { data, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString(), amount_paid: (before as any).amount })
    .eq("id", paymentId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const p = data as any;

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "payment.mark_paid",
    resourceType: "payments",
    resourceId: String(paymentId),
    before,
    after: { ...p, note: note ?? null },
  });

  return {
    id: p.id,
    userId: p.user_id,
    product: p.product,
    amount: p.amount,
    amountDue: p.amount_due,
    discount: p.discount,
    status: p.status,
    orderCode: p.order_code,
    promoCode: p.promo_code,
    createdAt: p.created_at,
    paidAt: p.paid_at,
  };
}

export type CouponRow = { code: string; discount: number; product: string | null; expiresAt: string | null };

export async function listCoupons(): Promise<CouponRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("coupons").select("*").order("code");
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((c) => ({ code: c.code, discount: c.discount, product: c.product, expiresAt: c.expires_at }));
}

export async function upsertCoupon(
  input: { code: string; discount: number; product: string | null; expiresAt: string | null },
  admin: AdminIdentity
): Promise<CouponRow> {
  const supabase = createSupabaseAdminClient();
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("INVALID_CODE");

  const { data: before } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();

  const { data, error } = await supabase
    .from("coupons")
    .upsert({ code, discount: input.discount, product: input.product, expires_at: input.expiresAt })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const c = data as any;

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: before ? "coupon.update" : "coupon.create",
    resourceType: "coupons",
    resourceId: code,
    before: before ?? null,
    after: c,
  });

  return { code: c.code, discount: c.discount, product: c.product, expiresAt: c.expires_at };
}

export async function deleteCoupon(code: string, admin: AdminIdentity): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();
  if (!before) return;

  const { error } = await supabase.from("coupons").delete().eq("code", code);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: "coupon.delete",
    resourceType: "coupons",
    resourceId: code,
    before,
    after: null,
  });
}
