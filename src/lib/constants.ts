/*  src/lib/constants.ts
    ───────────────────────────────────────────────────────── */

/** Định danh dịch vụ */
export const SERVICE = {
  MBTI     : "mbti",
  HOLLAND  : "holland",
  KNOWDELL : "knowdell",
  COMBO    : "combo",
} as const;

/** Giá NIÊM YẾT (đồng) – KHÔNG trừ khuyến mãi */
export const PRICES: Record<(typeof SERVICE)[keyof typeof SERVICE], number> = {
  mbti    : 10_000,
  holland : 20_000,
  knowdell: 100_000,
  combo   : 90_000,               // giá gói 3 bài test
};

/** Thành phần cấu thành combo */
export const COMBO_COMPONENTS: Record<string, string[]> = {
  combo: [SERVICE.MBTI, SERVICE.HOLLAND, SERVICE.KNOWDELL],
};

/** Trạng thái thanh toán (luôn chữ thường để khớp DB) */
export const STATUS = {
  PAID    : "paid",
  PENDING : "pending",
} as const;

/* ───────────────────────────────────────────────────────── */
/* Tiện ích: tính số tiền còn thiếu cho combo (không tính mã giảm) */

/**
 * @param paidProducts  mảng product đã "paid" của user (mbti, holland, knowdell)
 * @returns số tiền còn thiếu để đủ 90 K
 *
 *   comboOutstanding(['mbti'])            // 80 000
 *   comboOutstanding(['mbti','holland'])  // 60 000
 *   comboOutstanding(['mbti','holland','knowdell']) // 0
 */
export function comboOutstanding(paidProducts: string[]): number {
  const already = paidProducts.reduce((sum, p) => {
    if (p in PRICES && p !== SERVICE.COMBO) return sum + PRICES[p as keyof typeof PRICES];
    return sum;
  }, 0);

  return Math.max(0, PRICES.combo - already);
}
