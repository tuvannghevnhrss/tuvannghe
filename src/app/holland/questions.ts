export interface HollandQuestion {
  id: number;
  question: string;
  options: string[];     // 2 lựa chọn, 0 / 1
}

/**
 * 18 câu hỏi Holland R-I-A-S-E-C (mỗi loại lặp lại 3 lần).
 * Chọn “Phù hợp” (0) hoặc “Không phù hợp” (1).
 */
export const QUESTIONS: HollandQuestion[] = [
  /* R - Realistic */
  {
    id: 1,
    question: "Bạn thích sửa chữa, lắp ráp hoặc làm những công việc tay chân (ví dụ: xe máy, đồ gỗ)?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 2,
    question: "Bạn muốn làm việc ngoài trời và vận động cơ thể hơn là ngồi văn phòng?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 3,
    question: "Bạn cảm thấy hứng thú với việc vận hành máy móc, thiết bị, công cụ?",
    options: ["Phù hợp", "Không phù hợp"],
  },

  /* I - Investigative */
  {
    id: 4,
    question: "Bạn thích phân tích số liệu hoặc giải quyết bài toán khoa học?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 5,
    question: "Bạn tò mò tìm hiểu nguyên nhân & cơ chế hoạt động của sự vật hiện tượng?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 6,
    question: "Bạn muốn làm việc trong phòng thí nghiệm hoặc nghiên cứu học thuật?",
    options: ["Phù hợp", "Không phù hợp"],
  },

  /* A - Artistic */
  {
    id: 7,
    question: "Bạn yêu thích vẽ tranh, thiết kế đồ hoạ, nhiếp ảnh hay làm nhạc?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 8,
    question: "Bạn thích những công việc đòi hỏi sự sáng tạo, ít quy tắc cứng nhắc?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 9,
    question: "Bạn hứng thú với việc biểu diễn (hát, nhảy, diễn xuất) trước công chúng?",
    options: ["Phù hợp", "Không phù hợp"],
  },

  /* S - Social */
  {
    id: 10,
    question: "Bạn thích giúp đỡ, hướng dẫn hoặc chăm sóc người khác?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 11,
    question: "Bạn muốn trở thành cố vấn, giáo viên hoặc nhân viên xã hội?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 12,
    question: "Bạn dễ dàng đồng cảm và lắng nghe vấn đề của người khác?",
    options: ["Phù hợp", "Không phù hợp"],
  },

  /* E - Enterprising */
  {
    id: 13,
    question: "Bạn hào hứng trong vai trò lãnh đạo, thuyết phục hoặc kinh doanh bán hàng?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 14,
    question: "Bạn thích đặt mục tiêu lớn và điều hành dự án hay đội nhóm để đạt được chúng?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 15,
    question: "Bạn cảm thấy tự tin khi đàm phán, thuyết trình trước đám đông?",
    options: ["Phù hợp", "Không phù hợp"],
  },

  /* C - Conventional */
  {
    id: 16,
    question: "Bạn thích sắp xếp hồ sơ, quản lý dữ liệu, làm việc với bảng tính rõ ràng?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 17,
    question: "Bạn đánh giá cao sự chính xác và quy trình khi hoàn thành công việc hành chính?",
    options: ["Phù hợp", "Không phù hợp"],
  },
  {
    id: 18,
    question: "Bạn thoải mái với công việc lặp lại, theo quy tắc cố định và chi tiết?",
    options: ["Phù hợp", "Không phù hợp"],
  },
];
