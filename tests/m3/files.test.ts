import { describe, expect, it } from "vitest";
import { CvFileError, extractCvText, sniffKind, validateCvFile } from "../../src/lib/m3/files";
import { makeDocx, makePdf, makePlainZip } from "./helpers";

const LONG = Array.from({ length: 14 }, (_, i) => `Cong ty ${i + 1}: phu trach tuyen dung, giam thoi gian tuyen tu 45 xuong 28 ngay, dao tao 6 quan ly`).join("\n");

describe("CV upload — kiểm tra theo nội dung thực tế", () => {
  it("nhận diện PDF và DOCX bằng magic bytes", () => {
    expect(sniffKind(makePdf(LONG))).toBe("pdf");
    expect(sniffKind(makeDocx([LONG]))).toBe("docx");
  });

  it("từ chối ZIP thường, file văn bản đổi đuôi, file rỗng", () => {
    expect(() => validateCvFile(makePlainZip(), "application/zip")).toThrow(CvFileError);
    expect(() => validateCvFile(new TextEncoder().encode("<html>cv.pdf</html>"), "application/pdf")).toThrow(/PDF hoặc DOCX/);
    expect(() => validateCvFile(new Uint8Array(0), "application/pdf")).toThrow(/rỗng/);
  });

  it("từ chối file vượt dung lượng", () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 10);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    try {
      validateCvFile(big, "application/pdf");
      throw new Error("should fail");
    } catch (e) {
      expect((e as CvFileError).code).toBe("FILE_TOO_LARGE");
    }
  });

  it("từ chối khi MIME khai báo không khớp nội dung (DOCX giả danh PDF)", () => {
    try {
      validateCvFile(makeDocx([LONG]), "application/pdf");
      throw new Error("should fail");
    } catch (e) {
      expect((e as CvFileError).code).toBe("MIME_MISMATCH");
    }
  });

  it("chấp nhận application/octet-stream vì đã kiểm tra nội dung", () => {
    expect(validateCvFile(makePdf(LONG), "application/octet-stream")).toBe("pdf");
  });

  it("trích văn bản từ PDF thật", async () => {
    const text = await extractCvText(makePdf(LONG), "pdf");
    expect(text).toContain("phu trach tuyen dung");
    expect(text.length).toBeGreaterThan(200);
  });

  it("trích văn bản từ DOCX thật", async () => {
    const text = await extractCvText(makeDocx(LONG.split("\n")), "docx");
    expect(text).toContain("giam thoi gian tuyen");
  });

  it("báo lỗi rõ khi file gần như không có chữ (PDF scan)", async () => {
    await expect(extractCvText(makePdf("a"), "pdf")).rejects.toMatchObject({ code: "NO_TEXT" });
  });

  it("báo lỗi rõ khi file hỏng", async () => {
    const broken = new Uint8Array(Buffer.from("%PDF-1.4 this is not really a pdf"));
    await expect(extractCvText(broken, "pdf")).rejects.toBeInstanceOf(CvFileError);
  });
});
