/** Tiện ích văn bản thuần (không phụ thuộc mạng/DB) — dễ kiểm thử. */

/** Chuẩn hóa để so khớp: bỏ dấu, hạ chữ thường, gộp khoảng trắng, bỏ dấu câu. */
export function normalizeForMatch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `quote` có thực sự xuất hiện trong `source` không (so khớp mềm, bỏ dấu/dấu câu). */
export function quoteAppearsIn(quote: string | null | undefined, source: string): boolean {
  if (!quote) return false;
  const q = normalizeForMatch(quote);
  if (q.length < 6) return false;
  return normalizeForMatch(source).includes(q);
}

function tokens(s: string): Set<string> {
  return new Set(normalizeForMatch(s).split(" ").filter((t) => t.length > 1));
}

/** Độ tương đồng Jaccard giữa hai câu (0–1). */
export function jaccard(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter += 1;
  });
  return inter / (ta.size + tb.size - inter);
}

/** Trả về câu đã hỏi giống nhất với `question` (nếu vượt ngưỡng). */
export function findSimilarQuestion(
  question: string,
  asked: string[],
  threshold = 0.62,
): { index: number; score: number } | null {
  let best: { index: number; score: number } | null = null;
  asked.forEach((q, index) => {
    const score = jaccard(question, q);
    if (score >= threshold && (!best || score > best.score)) best = { index, score };
  });
  return best;
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Chuẩn hóa văn bản trích từ file: bỏ ký tự điều khiển, gộp dòng trống. */
export function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
