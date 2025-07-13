export const SERVICE = {
  MBTI     : 'mbti',
  HOLLAND  : 'holland',
  KNOWDELL : 'knowdell',
  COMBO    : 'combo',
} as const;

export const PRICES: Record<(typeof SERVICE)[keyof typeof SERVICE], number> = {
  mbti    : 10_000,
  holland : 20_000,
  knowdell: 100_000,
  combo   : 90_000,          // giá ưu đãi khi mua cả 3
};

export const COMBO_COMPONENTS: Record<string, string[]> = {
  combo: [SERVICE.MBTI, SERVICE.HOLLAND, SERVICE.KNOWDELL],
};
