import { createInterviewSupabaseClient } from "@/app/api/interview/_lib/supabase";

export const runtime = "nodejs";

/**
 * Dọn dữ liệu Module 3 v2 đã hết hạn lưu trữ (CV, JD, buổi phỏng vấn, file gốc).
 * Bảo vệ bằng CRON_SECRET: Authorization: Bearer <CRON_SECRET>. Không có secret → từ chối.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const db = createInterviewSupabaseClient();

  // Xóa file gốc đã hết hạn trước khi xóa bản ghi
  const { data: expired } = await db
    .from("m3_cv_documents")
    .select("storage_path")
    .lt("expires_at", new Date().toISOString())
    .not("storage_path", "is", null)
    .limit(500);
  const paths = (expired ?? []).map((r) => r.storage_path as string).filter(Boolean);
  if (paths.length) await db.storage.from("m3-cv").remove(paths);

  const { data, error } = await db.rpc("m3_purge_expired");
  if (error) return Response.json({ error: "PURGE_FAILED", message: error.message }, { status: 500 });
  return Response.json({ ok: true, files_removed: paths.length, result: data });
}
