/*  src/lib/constants.ts
    ───────────────────────────────────────────────────────── */

/** Định danh dịch vụ */
export const SERVICE = {
  MBTI               : "mbti",
  HOLLAND            : "holland",
  KNOWDELL           : "knowdell",
  COMBO              : "combo",
  INTERVIEW_STARTER  : "interview_starter",
  INTERVIEW_PRO      : "interview_pro",
  INTERVIEW_PREMIUM  : "interview_premium",
} as const;

export type ServiceKey = (typeof SERVICE)[keyof typeof SERVICE];

/** Giá NIÊM YẾT (đồng) – KHÔNG trừ khuyến mãi */
export const PRICES: Record<ServiceKey, number> = {
  mbti              : 0,
  holland           : 20_000,
  knowdell          : 100_000,
  combo             : 90_000,
  interview_starter : 89_000,
  interview_pro     : 199_000,
  interview_premium : 379_000,
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

/** Chi tiết gói Interview — dùng cho pricing page và access control */
export type InterviewPackageMeta = {
  id            : ServiceKey;
  name          : string;
  tagline       : string;
  price         : number;       // giá bán
  originalPrice : number;       // giá gốc (gạch ngang)
  duration      : number;       // ngày
  popular       : boolean;
  color         : "slate" | "emerald" | "teal";
  limits: {
    module1     : number | "unlimited";
    module2     : number | "unlimited";
    module3     : number | "unlimited";
    assessments : string;
  };
  features      : string[];
};

export const INTERVIEW_PACKAGES: InterviewPackageMeta[] = [
  {
    id           : "interview_starter",
    name         : "Khởi động",
    tagline      : "Dễ bắt đầu",
    price        : 89_000,
    originalPrice: 149_000,
    duration     : 14,
    popular      : false,
    color        : "slate",
    limits: {
      module1    : 5,
      module2    : 2,
      module3    : 0,
      assessments: "Holland cơ bản (tặng kèm)",
    },
    features: [
      "5 buổi luyện ghi âm Module 1",
      "2 buổi Module 2 — Live AI hỏi đáp",
      "Tặng 1 bài Holland cơ bản",
      "Voucher nâng cấp 50.000đ trong 7 ngày",
    ],
  },
  {
    id           : "interview_pro",
    name         : "Luyện tập",
    tagline      : "Gói chủ lực",
    price        : 199_000,
    originalPrice: 299_000,
    duration     : 30,
    popular      : true,
    color        : "emerald",
    limits: {
      module1    : 20,
      module2    : 8,
      module3    : 1,
      assessments: "Holland + Knowdell",
    },
    features: [
      "20 buổi Module 1 — ghi âm & AI feedback",
      "8 buổi Module 2 — Live AI hỏi đáp theo lượt",
      "1 buổi Module 3 — giả lập video thời gian thực",
      "Cá nhân hóa câu hỏi theo JD & CV",
      "Trắc nghiệm Holland + Knowdell",
      "AI feedback chi tiết sau mỗi buổi",
    ],
  },
  {
    id           : "interview_premium",
    name         : "Tăng tốc",
    tagline      : "Luyện cường độ cao",
    price        : 379_000,
    originalPrice: 549_000,
    duration     : 60,
    popular      : false,
    color        : "teal",
    limits: {
      module1    : 40,
      module2    : 20,
      module3    : 3,
      assessments: "Holland + Knowdell",
    },
    features: [
      "40 buổi Module 1 + 20 buổi Module 2",
      "3 buổi Module 3 — giả lập video thời gian thực",
      "Cá nhân hóa sâu theo vị trí ứng tuyển",
      "Báo cáo tiến bộ theo thời gian",
      "Ưu tiên hỗ trợ qua Zalo / email",
    ],
  },
];

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
