import { HttpError, authed, errorResponse, json } from "@/lib/m3/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    if (!UUID.test(id)) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy CV.");
    const { data, error } = await db
      .from("m3_cv_documents")
      .select("id, file_name, file_size, file_kind, stored_original, language, status, expires_at, created_at, parsed, injection")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy CV.");
    return json({ document: data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Xóa CV: xóa file gốc (nếu có), dữ liệu phân tích và mọi buổi phỏng vấn sinh ra từ CV này (cascade). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, db } = await authed();
    if (!UUID.test(id)) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy CV.");
    const { data: doc } = await db
      .from("m3_cv_documents")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doc) throw new HttpError(404, "NOT_FOUND", "Không tìm thấy CV.");
    if (doc.storage_path) await db.storage.from("m3-cv").remove([doc.storage_path]);
    const { error } = await db.from("m3_cv_documents").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return json({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
