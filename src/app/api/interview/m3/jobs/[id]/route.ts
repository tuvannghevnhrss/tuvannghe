import { HttpError, authed, errorResponse, json } from "@/lib/m3/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    if (!UUID.test(id)) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy JD.");
    const { data, error } = await db
      .from("m3_job_descriptions")
      .select("id, title, language, status, created_at, expires_at, parsed, injection")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy JD.");
    return json({ job: data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    if (!UUID.test(id)) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy JD.");
    const { data } = await db.from("m3_job_descriptions").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!data) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy JD.");
    const { error } = await db.from("m3_job_descriptions").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return json({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
