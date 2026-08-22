/**
 * Rule-based User Health — KHÔNG AI. Mọi trạng thái được suy ra từ tín hiệu
 * dữ liệu thật (payments, interview_sessions_v2, career_profiles,
 * user_directory), không suy đoán. Ưu tiên đánh giá thận trọng: dùng
 * "🟡 Có thể cần chú ý" thay vì "🔴 Cần hỗ trợ" khi chưa đủ bằng chứng cụ thể.
 */

export type UserHealthStatus = "new" | "needs_support" | "stuck" | "inactive" | "completed" | "healthy";

export type UserHealth = {
  status: UserHealthStatus;
  emoji: string;
  label: string;
  reason: string;
};

export type UserHealthSignals = {
  createdAt: string;
  /** max(last_sign_in_at, payment mới nhất, interview session mới nhất, career_profiles.updated_at) */
  lastActivityAt: string | null;
  hasAnyPaidProduct: boolean;
  hasPaidInterviewPackage: boolean;
  latestInterviewPurchaseAt: string | null;
  totalInterviewSessionCount: number;
  completedInterviewSessionCount: number;
  /** phiên status='failed' trong 14 ngày gần nhất */
  failedInterviewSessionCount14d: number;
  latestInterviewSessionAt: string | null;
  /** có payment pending > 24h chưa từng được paid (không phải đang chờ QR bình thường) */
  hasStalePendingPayment: boolean;
  hasCompletedMbti: boolean;
  hasCompletedHolland: boolean;
  hasCompletedKnowdell: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

export function computeUserHealth(s: UserHealthSignals): UserHealth {
  const accountAgeDays = daysSince(s.createdAt) ?? 0;
  const lastActivityDays = daysSince(s.lastActivityAt);
  const purchaseAgeDays = daysSince(s.latestInterviewPurchaseAt);
  const lastSessionAgeDays = daysSince(s.latestInterviewSessionAt);

  const hasAnyMeaningfulActivity =
    s.hasAnyPaidProduct || s.hasCompletedMbti || s.hasCompletedHolland || s.hasCompletedKnowdell || s.totalInterviewSessionCount > 0;

  // 1) NEW — tài khoản < 7 ngày, chưa có hoạt động đáng kể. Kiểm tra trước
  // các rule khác vì user mới không nên bị gắn "inactive"/"stuck" ngay.
  if (accountAgeDays < 7 && !hasAnyMeaningfulActivity) {
    return { status: "new", emoji: "🔵", label: "Mới", reason: "Tài khoản mới tạo trong 7 ngày, chưa có hoạt động." };
  }

  // 2) NEEDS_SUPPORT — chỉ khi có bằng chứng kỹ thuật cụ thể, không suy đoán
  // từ việc "không hoạt động lâu".
  if (s.failedInterviewSessionCount14d >= 2) {
    return {
      status: "needs_support",
      emoji: "🔴",
      label: "Cần hỗ trợ",
      reason: `Có ${s.failedInterviewSessionCount14d} phiên phỏng vấn AI thất bại trong 14 ngày gần đây.`,
    };
  }
  if (s.hasStalePendingPayment) {
    return {
      status: "needs_support",
      emoji: "🔴",
      label: "Cần hỗ trợ",
      reason: "Có giao dịch thanh toán đang chờ hơn 24 giờ chưa được xác nhận.",
    };
  }

  // 3) STUCK — đã mua nhưng chưa dùng, hoặc bỏ dở giữa chừng, sau một
  // khoảng thời gian hợp lý (3 ngày) để không báo động quá sớm.
  if (s.hasPaidInterviewPackage && s.completedInterviewSessionCount === 0 && purchaseAgeDays !== null && purchaseAgeDays >= 3) {
    return {
      status: "stuck",
      emoji: "🟠",
      label: "Đang mắc kẹt",
      reason: `Đã mua gói phỏng vấn AI ${Math.floor(purchaseAgeDays)} ngày trước nhưng chưa hoàn thành buổi luyện nào.`,
    };
  }
  if (
    s.totalInterviewSessionCount > 0 &&
    s.completedInterviewSessionCount < s.totalInterviewSessionCount &&
    lastSessionAgeDays !== null &&
    lastSessionAgeDays >= 5 &&
    lastSessionAgeDays < 30
  ) {
    return {
      status: "stuck",
      emoji: "🟠",
      label: "Đang mắc kẹt",
      reason: `Có buổi luyện phỏng vấn chưa hoàn thành, không hoạt động ${Math.floor(lastSessionAgeDays)} ngày.`,
    };
  }

  // 4) INACTIVE — không hoạt động lâu, nhưng KHÔNG đủ bằng chứng để nói
  // "cần hỗ trợ". Dùng 🟡 thận trọng thay vì 🔴 theo đúng yêu cầu.
  if (lastActivityDays !== null && lastActivityDays >= 14) {
    return {
      status: "inactive",
      emoji: "🟡",
      label: "Không hoạt động",
      reason: `Không có hoạt động trong ${Math.floor(lastActivityDays)} ngày.`,
    };
  }

  // 5) COMPLETED — đã hoàn thành hành trình cơ bản (3 trắc nghiệm) và có ít
  // nhất 1 buổi phỏng vấn AI hoàn thành. Không suy diễn "đã đạt mục tiêu"
  // nếu dữ liệu không thể hiện rõ.
  if (s.hasCompletedMbti && s.hasCompletedHolland && s.hasCompletedKnowdell && s.completedInterviewSessionCount > 0) {
    return { status: "completed", emoji: "🟣", label: "Hoàn thành", reason: "Đã hoàn thành MBTI, Holland, Giá trị bản thân và có buổi phỏng vấn AI hoàn thành." };
  }

  return { status: "healthy", emoji: "🟢", label: "Bình thường", reason: "Đang sử dụng bình thường, không phát hiện vấn đề." };
}
