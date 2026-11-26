/** Kiểm tra & trích văn bản từ CV (PDF / DOCX). Kiểm tra theo nội dung thực tế, không chỉ theo đuôi file. */
import { M3_LIMITS } from "./config";
import { cleanExtractedText } from "./text";

export type CvFileKind = "pdf" | "docx";

export class CvFileError extends Error {
  constructor(
    public code:
      | "FILE_EMPTY"
      | "FILE_TOO_LARGE"
      | "UNSUPPORTED_TYPE"
      | "MIME_MISMATCH"
      | "CORRUPT_FILE"
      | "NO_TEXT"
      | "PASSWORD_PROTECTED",
    message: string,
  ) {
    super(message);
  }
}

const ALLOWED_MIME: Record<CvFileKind, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

/** Xác định loại file theo "magic bytes". */
export function sniffKind(buf: Uint8Array): CvFileKind | null {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d) {
    return "pdf"; // %PDF-
  }
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05)) {
    // ZIP → phải chứa word/document.xml mới là DOCX
    const probe = Buffer.from(buf.buffer, buf.byteOffset, Math.min(buf.length, buf.length)).toString("latin1");
    if (probe.includes("word/document.xml") && probe.includes("[Content_Types].xml")) return "docx";
  }
  return null;
}

export function validateCvFile(buf: Uint8Array, declaredMime: string | undefined): CvFileKind {
  if (!buf.length) throw new CvFileError("FILE_EMPTY", "File rỗng.");
  if (buf.length > M3_LIMITS.cvMaxBytes) {
    throw new CvFileError("FILE_TOO_LARGE", `File vượt quá ${Math.round(M3_LIMITS.cvMaxBytes / 1024 / 1024)} MB.`);
  }
  const kind = sniffKind(buf);
  if (!kind) throw new CvFileError("UNSUPPORTED_TYPE", "Chỉ hỗ trợ CV dạng PDF hoặc DOCX.");
  const mime = (declaredMime ?? "").toLowerCase();
  // Trình duyệt đôi khi gửi application/octet-stream — chấp nhận, vì nội dung thực tế đã được kiểm tra.
  if (mime && mime !== "application/octet-stream" && !ALLOWED_MIME[kind].includes(mime)) {
    throw new CvFileError("MIME_MISMATCH", "Loại file khai báo không khớp với nội dung thực tế.");
  }
  return kind;
}

export async function extractCvText(buf: Uint8Array, kind: CvFileKind): Promise<string> {
  let text = "";
  try {
    if (kind === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
      text = res.value;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/password/i.test(msg)) throw new CvFileError("PASSWORD_PROTECTED", "File được bảo vệ bằng mật khẩu.");
    throw new CvFileError("CORRUPT_FILE", "Không đọc được file. File có thể bị lỗi.");
  }
  const cleaned = cleanExtractedText(text);
  if (cleaned.length < M3_LIMITS.cvMinChars) {
    throw new CvFileError(
      "NO_TEXT",
      "Không trích được đủ nội dung chữ từ file (có thể là CV dạng ảnh/scan). Hãy dùng file có thể chọn/sao chép chữ.",
    );
  }
  return cleaned.slice(0, M3_LIMITS.cvMaxChars);
}
