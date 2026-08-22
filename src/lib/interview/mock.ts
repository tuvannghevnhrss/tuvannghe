import type {
  InterviewDashboardStat,
  InterviewHistoryItem,
  InterviewInsight,
  InterviewRecentSession,
  InterviewResultPayload,
} from "./types";

export const interviewDashboardStats: InterviewDashboardStat[] = [
  { label: "Tổng phiên", value: "18", hint: "Tất cả các module" },
  { label: "Điểm trung bình", value: "82/100", hint: "4 buổi gần nhất" },
  { label: "Đang xử lý", value: "3", hint: "Đang chờ AI phân tích" },
  { label: "Tiến độ 30 ngày", value: "+11%", hint: "So với tháng trước" },
];

export const interviewRecentSessions: InterviewRecentSession[] = [
  {
    id: "result-frontend-jr",
    title: "Frontend Screening",
    moduleId: "module-1",
    role: "Frontend Developer",
    level: "Junior",
    score: 78,
    status: "completed",
    createdAt: "2026-04-07T09:30:00.000Z",
  },
  {
    id: "result-backend-mid",
    title: "Backend Behavioral Round",
    moduleId: "module-2",
    role: "Backend Developer",
    level: "Middle",
    score: 84,
    status: "completed",
    createdAt: "2026-04-08T14:10:00.000Z",
  },
  {
    id: "result-fullstack-live",
    title: "Fullstack Live AI",
    moduleId: "module-2",
    role: "Fullstack Developer",
    level: "Senior",
    score: 0,
    status: "processing",
    createdAt: "2026-04-09T08:45:00.000Z",
  },
];

export const interviewInsights: InterviewInsight[] = [
  {
    title: "Thế mạnh đang ổn định",
    text: "Bạn trả lời vào đúng trọng tâm vấn đề và duy trì được bố cục logic ở nhóm câu hỏi kỹ thuật.",
  },
  {
    title: "Cần cải thiện",
    text: "Phần mở đầu và kết luận cho mỗi câu hỏi còn hơi ngắn, chưa tạo được cảm giác tự tin.",
  },
  {
    title: "Gợi ý tiếp theo",
    text: "Nên ưu tiên Module 2 cho role Frontend Middle để luyện eye contact và pacing khi trả lời.",
  },
];

export const interviewHistory: InterviewHistoryItem[] = [
  {
    id: "result-frontend-jr",
    moduleId: "module-1",
    role: "Frontend Developer",
    level: "Junior",
    score: 78,
    createdAt: "2026-04-07T09:30:00.000Z",
    summary: "Trả lời rõ ràng, nhưng chưa có nhiều ví dụ cụ thể.",
    status: "completed",
  },
  {
    id: "result-backend-mid",
    moduleId: "module-2",
    role: "Backend Developer",
    level: "Middle",
    score: 84,
    createdAt: "2026-04-08T14:10:00.000Z",
    summary: "Nội dung tốt, điểm trừ ở phần nhìn camera và nhịp ngừng.",
    status: "completed",
  },
  {
    id: "result-fullstack-live",
    moduleId: "module-2",
    role: "Fullstack Developer",
    level: "Senior",
    score: 0,
    createdAt: "2026-04-09T08:45:00.000Z",
    summary: "Phiên live đang chờ AI tổng hợp phản hồi.",
    status: "processing",
  },
];

export const interviewResultMap: Record<string, InterviewResultPayload> = {
  "result-frontend-jr": {
    id: "result-frontend-jr",
    moduleId: "module-1",
    role: "Frontend Developer",
    level: "Junior",
    overallScore: 78,
    communicationScore: 74,
    contentScore: 82,
    confidenceScore: 77,
    strengths: [
      "Trả lời ngắm đúng yêu cầu câu hỏi",
      "Có sự liên kết giữa kinh nghiệm và kỹ năng",
      "Nhịp nói dễ nghe",
    ],
    weaknesses: [
      "Thiếu ví dụ đo lường kết quả",
      "Mở đầu hơi chưa tự tin",
      "Chưa tổng kết ý chính cuối câu",
    ],
    suggestions: [
      "Áp dụng cấu trúc STAR cho câu hỏi kinh nghiệm",
      "Thêm 1 chỉ số cụ thể trong mỗi câu hỏi thành tích",
      "Tập mở đầu 20 giây để tạo nhiệt và sự tự tin",
    ],
    transcriptPreview:
      "Em đã tham gia xây dựng giao diện landing page, tối ưu responsive và kết hợp API để lấy dữ liệu sản phẩm...",
  },
  "result-backend-mid": {
    id: "result-backend-mid",
    moduleId: "module-2",
    role: "Backend Developer",
    level: "Middle",
    overallScore: 84,
    communicationScore: 80,
    contentScore: 88,
    confidenceScore: 83,
    strengths: [
      "Nội dung phân tích có chiều sâu",
      "Đưa ra được trade-off kỹ thuật",
      "Sử dụng thuật ngữ chính xác",
    ],
    weaknesses: [
      "Tồn tại khoảng dừng hơi dài",
      "Ánh mắt chưa ổn định với camera",
      "Một số câu trả lời hơi dài dòng",
    ],
    suggestions: [
      "Rút gọn câu trả lời còn 90–120 giây",
      "Tập nhìn camera ở 3 điểm mốc chính",
      "Sử dụng bullet thinking trước khi nói",
    ],
    transcriptPreview:
      "Nếu thiết kế payment workflow, em sẽ tách idempotency key, transaction state và webhook reconciliation thành các lớp riêng...",
  },
};
