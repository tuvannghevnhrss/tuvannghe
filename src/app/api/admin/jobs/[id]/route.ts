import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "../../_lib/requireAdmin";
import { writeAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EDITABLE_FIELDS = [
  "title",
  "company",
  "location",
  "employment_type",
  "category",
  "level",
  "salary_display",
  "description",
  "requirements",
  "benefits",
  "contact_email",
  "apply_url",
  "status",
  "deadline",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("jobs", "edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("job_postings").select("*").eq("id", id).maybeSingle();

  const { data, error } = await supabase.from("job_postings").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: auth.admin.userId,
    actorEmail: auth.admin.email,
    action: "job.update",
    resourceType: "job_postings",
    resourceId: id,
    before,
    after: data,
  });

  return NextResponse.json({ job: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("jobs", "full");
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("job_postings").select("*").eq("id", id).maybeSingle();

  const { error } = await supabase.from("job_postings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: auth.admin.userId,
    actorEmail: auth.admin.email,
    action: "job.delete",
    resourceType: "job_postings",
    resourceId: id,
    before,
    after: null,
  });

  return NextResponse.json({ ok: true });
}
