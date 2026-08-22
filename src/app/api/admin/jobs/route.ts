import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "../_lib/requireAdmin";
import { writeAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const auth = await requireAdmin("jobs", "view");
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("job_postings").select("*").order("posted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("jobs", "edit");
  if (auth.error) return auth.error;

  const body = await req.json();
  const title: string = (body.title ?? "").trim();
  const company: string = (body.company ?? "").trim();
  const description: string = (body.description ?? "").trim();

  if (!title || !company || !description) {
    return NextResponse.json({ error: "Thiếu tiêu đề, công ty hoặc mô tả công việc" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const baseSlug = slugify(body.slug || title) || "viec-lam";

  let slug = baseSlug;
  for (let i = 1; i < 50; i++) {
    const { data: existing } = await supabase.from("job_postings").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  const { data, error } = await supabase
    .from("job_postings")
    .insert({
      slug,
      title,
      company,
      location: (body.location ?? "").trim() || "Toàn quốc",
      employment_type: body.employment_type ?? "full_time",
      category: (body.category ?? "").trim() || "Khác",
      level: body.level || null,
      salary_display: body.salary_display || null,
      description,
      requirements: body.requirements || null,
      benefits: body.benefits || null,
      contact_email: body.contact_email || null,
      apply_url: body.apply_url || null,
      status: body.status === "published" ? "published" : "draft",
      deadline: body.deadline || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    actorId: auth.admin.userId,
    actorEmail: auth.admin.email,
    action: "job.create",
    resourceType: "job_postings",
    resourceId: data.id,
    after: data,
  });

  return NextResponse.json({ job: data }, { status: 201 });
}
