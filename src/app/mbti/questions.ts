export interface MBTIQuestion {
  id: number;
  question: string;
  options: [string, string];  // mỗi câu chỉ có 2 phương án
}

/**
 * Danh sách 16 câu hỏi MBTI.
 * Bạn chỉ việc điền đủ 16 phần tử, id từ 1–16.
 */
export const QUESTIONS: MBTIQuestion[] = [
  {
    id: 1,
    question: "Bạn thích hoạt động xã hội năng động hay tận hưởng thời gian yên tĩnh riêng tư?",
    options: ["Xã hội năng động", "Yên tĩnh riêng tư"],
  },
  {
    id: 2,
    question: "Bạn ra quyết định dựa trên logic hay trên cảm xúc cá nhân?",
    options: ["Logic", "Cảm xúc"],
  },
  {
    id: 3,
    question: "Bạn thích tuân theo lịch trình chặt chẽ hay làm việc một cách linh hoạt?",
    options: ["Lịch trình chặt chẽ", "Linh hoạt"],
  },
  {
    id: 4,
    question: "Bạn tập trung vào chi tiết cụ thể hay nhìn vào bức tranh tổng thể?",
    options: ["Chi tiết cụ thể", "Tổng thể"],
  },
  {
    id: 5,
    question: "Bạn cảm thấy tràn đầy năng lượng sau khi ở cùng nhóm người hay sau khi ở một mình?",
    options: ["Cùng nhóm người", "Một mình"],
  },
  {
    id: 6,
    question: "Bạn thường đưa ra quyết định nhanh chóng hay cân nhắc lâu dài?",
    options: ["Nhanh chóng", "Cân nhắc lâu dài"],
  },
  {
    id: 7,
    question: "Bạn thích học hỏi thông qua thực hành hay qua lý thuyết?",
    options: ["Thực hành", "Lý thuyết"],
  },
  {
    id: 8,
    question: "Bạn có xu hướng lập kế hoạch trước hay thích để mọi chuyện diễn ra tự nhiên?",
    options: ["Lập kế hoạch", "Tự nhiên"],
  },
  {
    id: 9,
    question: "Bạn thích tương tác với nhiều người hay tập trung vào vài mối quan hệ sâu sắc?",
    options: ["Nhiều người", "Ít người sâu sắc"],
  },
  {
    id: 10,
    question: "Bạn ưu tiên sự công bằng và khách quan hay quan tâm đến hoàn cảnh và cảm xúc của người khác?",
    options: ["Công bằng, khách quan", "Quan tâm cảm xúc"],
  },
  {
    id: 11,
    question: "Bạn cảm thấy thoải mái khi tuân thủ quy tắc hay phá vỡ khuôn khổ để sáng tạo?",
    options: ["Tuân thủ quy tắc", "Phá khuôn khổ"],
  },
  {
    id: 12,
    question: "Bạn có trí tưởng tượng phong phú hay tập trung vào thực tại hơn?",
    options: ["Tưởng tượng phong phú", "Tập trung hiện tại"],
  },
  {
    id: 13,
    question: "Bạn thích làm việc theo nhóm có cấu trúc rõ ràng hay tự do không gian riêng?",
    options: ["Nhóm có cấu trúc", "Tự do riêng tư"],
  },
  {
    id: 14,
    question: "Bạn xử lý công việc một cách quyết đoán hay cân nhắc ý kiến của nhiều người?",
    options: ["Quyết đoán", "Cân nhắc ý kiến"],
  },
  {
    id: 15,
    question: "Bạn quan tâm đến số liệu, dữ liệu hay lớn lên cảm nhận, ấn tượng cá nhân?",
    options: ["Số liệu, dữ liệu", "Cảm nhận, ấn tượng"],
  },
  {
    id: 16,
    question: "Bạn thích tuân theo kế hoạch đã đặt ra hay linh hoạt thay đổi khi cần?",
    options: ["Tuân theo kế hoạch", "Linh hoạt thay đổi"],
  },
];
