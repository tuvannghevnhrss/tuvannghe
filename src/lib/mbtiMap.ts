/**
 * Tra cứu mô tả cho 16 kiểu MBTI.
 * (Giữ nguyên object lớn của anh/chị – rút gọn cho ví dụ)
 */
export const MBTI_MAP = {
  ISTJ: {
    intro: 'Người trách nhiệm, đáng tin cậy.',
    strengths: ['Tỉ mỉ', 'Kiên định'],
    flaws: ['Thiếu linh hoạt'],
    careers: ['Kế toán', 'Quản trị dự án'],
  },
  // ...15 mã còn lại
} as const;

/**
 * Trả về chuỗi markdown mô tả MBTI.
 * Được import & dùng tại /mbti/result.
 */
export function formatMbti(code: string): string {
  const d = MBTI_MAP[code as keyof typeof MBTI_MAP];
  if (!d) return `**${code}** – Chưa có mô tả chi tiết.`;

  return [
    `**${code}** – ${d.intro}`,
    '',
    '*Ưu điểm:*',
    ...d.strengths.map((s) => `• ${s}`),
    '',
    '*Khuyết điểm:*',
    ...d.flaws.map((f) => `• ${f}`),
    '',
    '*Gợi ý nghề nghiệp:*',
    ...d.careers.map((c) => `• ${c}`),
  ].join('\n');
}
