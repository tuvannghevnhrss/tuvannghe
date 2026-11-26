import { analyzeCv } from "@/lib/m3/analysis";
import { CvFileError, extractCvText, validateCvFile } from "@/lib/m3/files";
import {
  HttpError,
  authed,
  errorResponse,
  expiresAtIso,
  json,
  makeLlmContext,
  sha256Hex,
} from "@/lib/m3/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Danh sách CV của tôi (không trả văn bản thô). */
export async function GET() {
  try {
    const { user, db } = await authed();
    const { data, error } = await db
      .from("m3_cv_documents")
      .select("id, file_name, file_size, file_kind, stored_original, language, status, expires_at, created_at, parsed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return json({ documents: data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Upload + phân tích CV. multipart: file, consent="true", store_original="true|false". */
export async function POST(req: Request) {
  try {
    const { user, db } = await authed();
    const form = await req.formData();

    if (String(form.get("consent")) !== "true") {
      throw new HttpError(400, "CONSENT_REQUIRED", "Bạn cần đồng ý cho hệ thống xử lý CV trước khi tải lên.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "FILE_REQUIRED", "Chưa chọn file CV.");
    const storeOriginal = String(form.get("store_original")) === "true";

    const bytes = new Uint8Array(await file.arrayBuffer());
    let kind: "pdf" | "docx";
    let text: string;
    try {
      kind = validateCvFile(bytes, file.type);
      text = await extractCvText(bytes, kind);
    } catch (err) {
      if (err instanceof CvFileError) throw new HttpError(400, err.code, err.message);
      throw err;
    }

    const { ctx } = makeLlmContext(db, user.id, null);
    const analysis = await analyzeCv(text, ctx);

    const safeName = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || `cv.${kind}`;
    const { data: row, error } = await db
      .from("m3_cv_documents")
      .insert({
        user_id: user.id,
        file_name: safeName,
        file_size: bytes.length,
        file_kind: kind,
        stored_original: false,
        consent_at: new Date().toISOString(),
        text_hash: await sha256Hex(text),
        text_chars: text.length,
        language: analysis.parsed.language,
        parsed: analysis.parsed,
        injection: { ...analysis.injection, dropped_quotes: analysis.dropped_quotes },
        status: "ready",
        expires_at: expiresAtIso(),
      })
      .select("id, file_name, file_size, file_kind, stored_original, language, status, expires_at, created_at, parsed, injection")
      .single();
    if (error) throw error;

    // Chỉ lưu file gốc khi người dùng đồng ý rõ ràng
    if (storeOriginal) {
      const path = `${user.id}/${row.id}.${kind}`;
      const { error: upErr } = await db.storage.from("m3-cv").upload(path, bytes, {
        contentType: kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });
      if (upErr) {
        console.error("[m3] CV original upload failed:", upErr.message);
      } else {
        await db.from("m3_cv_documents").update({ storage_path: path, stored_original: true }).eq("id", row.id).eq("user_id", user.id);
        row.stored_original = true;
      }
    }
    return json({ document: row }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
