/* ------------------------------------------------------------------
   MBTI 60-item forced-choice questionnaire
   – 60 object, mỗi object gồm:
       • id       : chỉ số 1-60 (không bắt buộc với giải thuật, nhưng tiện debug)
       • question : văn bản câu hỏi / ngữ cảnh
       • options  : đúng 2 lựa chọn bắt buộc chọn một
       • pair     : cặp trục đang đo ("E","I" | "S","N" | "T","F" | "J","P")
-------------------------------------------------------------------*/

export const QUESTIONS = [
  /*  E – I --------------------------------------------------------- */
  { id: 1,  question: "Khi tan học bạn thích làm gì?",                     options: ["Gặp gỡ bạn bè và kể chuyện", "Về nhà và đọc sách"],         pair: ["E", "I"] },
  { id: 2,  question: "Bạn nhận năng lượng khi…",                          options: ["Tham gia các sự kiện đông người", "Có thời gian một mình suy nghĩ"],           pair: ["E", "I"] },
  { id: 3,  question: "Trong nhóm dự án, bạn thường…",                     options: ["Khởi xướng trao đổi lớn tiếng", "Quan sát và chỉ góp ý khi cần"],               pair: ["E", "I"] },
  { id: 4,  question: "Khi tham gia lớp mới bạn…",                          options: ["Bắt chuyện với mọi người", "Chờ người khác tới hỏi"],                         pair: ["E", "I"] },
  { id: 5,  question: "Bạn thích cuối tuần…",                               options: ["Đi phượt cùng nhóm đông", "Thư giãn một mình ở nhà"],                        pair: ["E", "I"] },
  { id: 6,  question: "Trả lời tin nhắn, bạn…",                             options: ["Ngay lập tức, thích trao đổi", "Khi thấy cần, thích ngắn gọn"],               pair: ["E", "I"] },
  { id: 7,  question: "Trên mạng xã hội bạn…",                              options: ["Thường đăng và bình luận", "Chỉ xem, ít khi đăng"],                         pair: ["E", "I"] },
  { id: 8,  question: "Bạn thấy hứng thú khi…",                             options: ["Làm việc nhóm sôi nổi", "Nghiên cứu sâu một mình"],                         pair: ["E", "I"] },
  { id: 9,  question: "Bạn học tốt hơn qua…",                               options: ["Thảo luận nhóm", "Tự ghi chú"],                                                pair: ["E", "I"] },
  { id: 10, question: "Bạn dễ cảm thấy mệt khi…",                           options: ["Ở một mình cả ngày", "Ở sự kiện đông người cả ngày"],                        pair: ["I", "E"] },
  { id: 11, question: "Khi gọi video bạn…",                                 options: ["Thấy hào hứng", "Cảm thấy tiêu hao năng lượng"],                              pair: ["E", "I"] },
  { id: 12, question: "Ở tiệc sinh nhật bạn thường…",                       options: ["Kể chuyện, khuấy động", "Ngồi nghe, mỉm cười"],                              pair: ["E", "I"] },
  { id: 13, question: "Bạn mô tả mình…",                                    options: ["Hướng ngoại, cởi mở", "Kín đáo, trầm lắng"],                                  pair: ["E", "I"] },
  { id: 14, question: "Bạn thích học qua…",                                 options: ["Thảo luận trực tiếp", "Đọc tài liệu"],                                        pair: ["E", "I"] },
  { id: 15, question: "Trong lớp học bạn…",                                 options: ["Giơ tay phát biểu", "Ghi chú lặng lẽ"],                                       pair: ["E", "I"] },

  /* S – N ----------------------------------------------------------- */
  { id: 16, question: "Khi học chủ đề mới, bạn muốn…",                      options: ["Ví dụ thực tế", "Khái niệm tổng quát"],                                       pair: ["S", "N"] },
  { id: 17, question: "Bạn tin tưởng…",                                     options: ["Thông tin có bằng chứng", "Trực giác, linh cảm"],                             pair: ["S", "N"] },
  { id: 18, question: "Bạn thích sách…",                                    options: ["Hướng dẫn thực hành", "Chủ đề giả tưởng"],                                   pair: ["S", "N"] },
  { id: 19, question: "Trong cuộc họp bạn tập trung vào…",                  options: ["Chi tiết cụ thể", "Tầm nhìn dài hạn"],                                       pair: ["S", "N"] },
  { id: 20, question: "Bạn nhớ tốt hơn…",                                   options: ["Sự kiện, con số", "Ý tưởng, ấn tượng"],                                       pair: ["S", "N"] },
  { id: 21, question: "Bạn đánh giá sản phẩm qua…",                         options: ["Tính năng đo được", "Khả năng đổi mới"],                                     pair: ["S", "N"] },
  { id: 22, question: "Bạn thích công việc…",                               options: ["Thủ công, hữu hình", "Sáng tạo ý tưởng"],                                    pair: ["S", "N"] },
  { id: 23, question: "Khi giải quyết vấn đề bạn…",                         options: ["Theo từng bước", "Nhảy vọt tìm giải pháp"],                                  pair: ["S", "N"] },
  { id: 24, question: "Bạn nhận xét người khác chủ yếu qua…",               options: ["Những gì họ làm", "Khả năng tiềm tàng"],                                     pair: ["S", "N"] },
  { id: 25, question: "Bạn hay nói…",                                       options: ["Tôi thấy…", "Tôi tưởng tượng…"],                                             pair: ["S", "N"] },
  { id: 26, question: "Bạn lưu ý…",                                         options: ["Chi tiết trang phục", "Ấn tượng tổng thể"],                                  pair: ["S", "N"] },
  { id: 27, question: "Bạn tin vào…",                                       options: ["Kinh nghiệm quá khứ", "Khả năng tương lai"],                                 pair: ["S", "N"] },
  { id: 28, question: "Bạn ưa thích…",                                      options: ["Công việc ổn định", "Khởi nghiệp sáng tạo"],                                 pair: ["S", "N"] },
  { id: 29, question: "Bạn mô tả bản thân…",                                options: ["Thực tế", "Mơ mộng"],                                                       pair: ["S", "N"] },
  { id: 30, question: "Bạn chọn mua đồ bằng cách…",                         options: ["Dùng thử thực tế", "Xem concept trước"],                                     pair: ["S", "N"] },

  /* T – F ----------------------------------------------------------- */
  { id: 31, question: "Khi ra quyết định bạn dựa trên…",                    options: ["Lý lẽ, tiêu chuẩn", "Cảm xúc, giá trị"],                                     pair: ["T", "F"] },
  { id: 32, question: "Bạn thấy dễ hơn khi…",                               options: ["Chỉ trích để cải thiện", "An ủi, khích lệ"],                                 pair: ["T", "F"] },
  { id: 33, question: "Bạn coi trọng…",                                     options: ["Công bằng", "Hòa hợp"],                                                     pair: ["T", "F"] },
  { id: 34, question: "Trong tranh luận bạn…",                              options: ["Tập trung logic", "Quan tâm cảm xúc"],                                       pair: ["T", "F"] },
  { id: 35, question: "Bạn mô tả mình…",                                    options: ["Thẳng thắn", "Dễ thông cảm"],                                               pair: ["T", "F"] },
  { id: 36, question: "Bạn phản ứng khi ai đó sai…",                        options: ["Sửa ngay", "Nói khéo tránh làm họ buồn"],                                   pair: ["T", "F"] },
  { id: 37, question: "Bạn đánh giá ý tưởng bằng…",                         options: ["Mục tiêu & số liệu", "Ảnh hưởng tới con người"],                             pair: ["T", "F"] },
  { id: 38, question: "Bạn nghĩ lời khen nên…",                             options: ["Chân thật, thẳng", "Động viên, dịu dàng"],                                  pair: ["T", "F"] },
  { id: 39, question: "Bạn cảm thấy thoải mái khi…",                        options: ["Có luật rõ ràng", "Không khí thân thiện"],                                   pair: ["T", "F"] },
  { id: 40, question: "Bạn chọn nghề…",                                     options: ["Phân tích, kỹ thuật", "Giúp đỡ, phục vụ"],                                   pair: ["T", "F"] },
  { id: 41, question: "Người ta nhận xét bạn…",                             options: ["Lý trí", "Nhạy cảm"],                                                      pair: ["T", "F"] },
  { id: 42, question: "Bạn thấy…",                                          options: ["Tranh luận là bình thường", "Tranh luận dễ mất hòa khí"],                   pair: ["T", "F"] },
  { id: 43, question: "Bạn phản ứng trước quyết định mới…",                 options: ["Đánh giá tính khả thi", "Đánh giá tác động con người"],                     pair: ["T", "F"] },
  { id: 44, question: "Bạn coi trọng hơn…",                                 options: ["Sự thật", "Lòng trắc ẩn"],                                                  pair: ["T", "F"] },
  { id: 45, question: "Bạn thích giao tiếp…",                               options: ["Thẳng vấn đề", "Quan tâm cảm xúc trước"],                                   pair: ["T", "F"] },

  /* J – P ----------------------------------------------------------- */
  { id: 46, question: "Khi làm dự án nhóm, bạn…",                           options: ["Lên plan chi tiết trước", "Tùy hứng linh hoạt"],                             pair: ["J", "P"] },
  { id: 47, question: "Bạn cảm thấy an tâm khi…",                           options: ["Mọi thứ định trước", "Có lựa chọn mở"],                                     pair: ["J", "P"] },
  { id: 48, question: "Bạn dọn phòng…",                                     options: ["Đều đặn theo lịch", "Khi thấy bừa mới dọn"],                                 pair: ["J", "P"] },
  { id: 49, question: "Bạn nộp bài…",                                       options: ["Trước hạn một ngày", "Sát giờ, miễn kịp"],                                   pair: ["J", "P"] },
  { id: 50, question: "Lịch cuối tuần của bạn…",                            options: ["Đặt lịch sẵn từ đầu tuần", "Đợi đến cuối tuần rồi quyết"],                   pair: ["J", "P"] },
  { id: 51, question: "Bạn làm việc tốt hơn khi…",                          options: ["Có deadline rõ", "Deadline linh hoạt"],                                      pair: ["J", "P"] },
  { id: 52, question: "Bạn mô tả mình…",                                    options: ["Ngăn nắp", "Tự do"],                                                        pair: ["J", "P"] },
  { id: 53, question: "Bạn xử lý email…",                                   options: ["Trả lời và phân loại ngay", "Để nhiều rồi xem sau"],                          pair: ["J", "P"] },
  { id: 54, question: "Đi du lịch bạn…",                                    options: ["Chuẩn bị kỹ hành trình", "Khám phá tuỳ thích"],                              pair: ["J", "P"] },
  { id: 55, question: "Bạn thấy bảng to-do…",                               options: ["Giúp duy trì kỷ luật", "Khá gò bó"],                                         pair: ["J", "P"] },
  { id: 56, question: "Bạn ưu tiên…",                                       options: ["Hoàn thành nhiệm vụ", "Trải nghiệm quá trình"],                              pair: ["J", "P"] },
  { id: 57, question: "Bạn ra quyết định…",                                 options: ["Nhanh chóng", "Đợi thêm thông tin"],                                         pair: ["J", "P"] },
  { id: 58, question: "Bạn học bài…",                                       options: ["Theo giáo trình", "Tự mò nhiều nguồn"],                                      pair: ["J", "P"] },
  { id: 59, question: "Bạn chọn mua đồ…",                                   options: ["Theo danh sách", "Ngẫu hứng"],                                              pair: ["J", "P"] },
  { id: 60, question: "Bạn phản ứng khi kế hoạch thay đổi…",                options: ["Khó chịu", "Thích thú với thay đổi"],                                        pair: ["J", "P"] }
] as const;

/* Kiểu cho 1 item – tiện cho TS */
export type Question = typeof QUESTIONS[number];

/* default export để code cũ import QUESTIONS mặc định vẫn chạy */
export default QUESTIONS;
