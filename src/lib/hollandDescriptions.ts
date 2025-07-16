// src/lib/hollandDescriptions.ts

export type HollandType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface HollandProfile {
  intro: string;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  careers: string[];
}

export const HOLLAND_MAP: Record<HollandType, HollandProfile> = {
  R: {
    intro:
      'Nhóm Kỹ thuật (R – Realistic): Thích làm việc với những vật cụ thể, máy móc, dụng cụ, cây cối, con vật hoặc các hoạt động ngoài trời.',
    traits: [
      'Thích tương tác với vật dụng, máy móc, cây cối và động vật hơn con người',
      'Học qua chơi, làm, hoạt động và thực hành',
      'Sử dụng khéo léo các dụng cụ; phối hợp tay mắt tốt',
      'Không thích lý thuyết, học thuộc lòng; thực hành nhanh qua hướng dẫn',
      'Thích các trò chơi vận động, không ngại “lăn đất”',
      'Sống tình cảm nhưng ít khi bày tỏ cảm xúc ra ngoài',
    ],
    strengths: [
      'Kiên định, vững chãi, ít thay đổi',
      'Sẵn sàng hành động ngay khi có cơ hội',
      'Bộc lộ tình cảm qua hành động hơn lời nói',
    ],
    weaknesses: [
      'Không giỏi diễn đạt ý tưởng bằng ngôn từ',
      'Ghét nói nhiều, giải thích dài dòng',
    ],
    improvements: [
      'Chia sẻ suy nghĩ và cảm xúc với người khác',
      'Luyện kỹ năng làm việc nhóm và thuyết trình',
      'Tìm bạn cộng tác để hỗ trợ phần ngôn ngữ – giao tiếp',
    ],
    careers: [
      'Nông – lâm – ngư nghiệp và các ngành liên quan',
      'Khoa học máy tính & Công nghệ thông tin',
      'Xây dựng, bảo trì, chế tạo (quy trình sản xuất)',
      'Thủ công, chế tác (mỹ nghệ, kim hoàn, nội thất)',
      'Vận hành – vận chuyển (logistics, điều phối)',
    ],
  },

  I: {
    intro:
      'Nhóm Nghiên cứu (I – Investigative): Thích quan sát, tìm tòi, khám phá, phân tích và đánh giá vấn đề hơn là hành động nhanh.',
    traits: [
      'Thích đặt câu hỏi “Tại sao?”, “Như thế nào?”, “Vì đâu?”',
      'Học giỏi và say mê tài liệu tham khảo ngoài',
      'Đào sâu bới kỹ, thường tập trung một mình',
      'Thường chậm quyết định, phụ thuộc dữ liệu',
    ],
    strengths: [
      'Khả năng học hỏi từ sách vở, nghiên cứu sâu',
      'Tư duy phân tích, hệ thống và logic',
      'Làm việc độc lập hiệu quả',
    ],
    weaknesses: [
      'Quá cẩn trọng, quyết định chậm',
      'Thiếu kỹ năng giao tiếp – thuyết phục',
      'Dễ mất cân bằng khi làm việc một mình lâu',
    ],
    improvements: [
      'Tham gia hoạt động ngoài trời – thể thao để thư giãn',
      'Luyện thói quen quyết định và hành động nhanh',
      'Tập giao tiếp, kết nối và làm việc nhóm thường xuyên',
    ],
    careers: [
      'Chính trị học, tâm lý học, xã hội học, nhân chủng học',
      'Khoa học tự nhiên & công nghệ (vật lý, hóa học, sinh học)',
      'Kỹ thuật & công nghệ (kiến trúc sư, kỹ sư, kỹ thuật viên)',
      'Chẩn đoán y khoa (bác sĩ, dược sĩ, chuyên viên y khoa)',
      'Phân tích dữ liệu – thống kê – nghiên cứu thị trường',
    ],
  },

  A: {
    intro:
      'Nhóm Nghệ thuật (A – Artistic): Sáng tạo, trực giác, thích làm việc trong tình huống không có khuôn khổ trước, dùng trí tưởng tượng cao.',
    traits: [
      'Yêu thích cái đẹp ở thiên nhiên, con người và đồ vật',
      'Trí tưởng tượng phong phú, trực giác mạnh, giàu ý tưởng',
      'Thiên về nghệ thuật: vẽ, nhảy múa, viết văn, âm nhạc…',
      'Không thích gò ép, mau chán lặp đi lặp lại',
    ],
    strengths: [
      'Khả năng sáng tạo và giàu ý tưởng',
      'Có khiếu thẩm mỹ: phối màu, vẽ, thiết kế, âm nhạc',
      'Nhạy cảm, trực giác giúp nắm bắt xu hướng mới',
    ],
    weaknesses: [
      'Ít tuân thủ luật lệ, quy trình',
      'Thiếu tính thực tế, dễ bốc đồng, mau chán',
    ],
    improvements: [
      'Tham gia các câu lạc bộ kỹ năng mềm – tin học – thiết kế',
      'Luyện kỹ năng làm việc nhóm và kiên nhẫn với quy trình',
      'Rèn luyện tính kỷ luật qua các hoạt động có lịch trình rõ ràng',
    ],
    careers: [
      'Thiết kế đồ họa, nội thất, thời trang',
      'Phát thanh – truyền hình – MC – Biên kịch – PR – Marketing',
      'Nhạc sĩ, họa sĩ, diễn viên, vũ công, sản xuất phim, nhiếp ảnh',
      'Nghệ thuật ứng dụng: trang trí, đạo diễn sân khấu, décor',
      'Viết sáng tạo: nhà văn, copywriter, biên tập viên',
    ],
  },

  S: {
    intro:
      'Nhóm Xã hội (S – Social): Thích giúp đỡ, đào tạo, tư vấn, chữa trị, truyền đạt thông tin và làm việc với con người.',
    traits: [
      'Thích công việc cộng đồng, phục vụ và hỗ trợ',
      'Mang lại niềm vui, sự an tâm cho người khác',
      'Khả năng lắng nghe, thấu hiểu, diễn đạt tốt',
      'Dễ kết nối và huy động nguồn lực xã hội',
    ],
    strengths: [
      'Nhiệt tình, sẵn sàng hỗ trợ người khác',
      'Khả năng ngôn ngữ, giao tiếp và thuyết trình',
      'Tạo dựng quan hệ tốt, gây ảnh hưởng tích cực',
    ],
    weaknesses: [
      'Nhạy cảm, sợ mất lòng người khác',
      'Dễ tự hy sinh, bỏ quên nhu cầu bản thân',
    ],
    improvements: [
      'Học cách từ chối lịch sự, đặt ranh giới',
      'Cân bằng giữa quan tâm người khác và bản thân',
      'Rèn kỹ năng quản lý cảm xúc, sức bật tâm lý',
    ],
    careers: [
      'Dịch vụ cộng đồng & xã hội: xã hội học, công tác xã hội, tư vấn tâm lý',
      'Giáo dục & đào tạo: giáo viên, huấn luyện viên, giảng viên',
      'Chăm sóc sức khỏe: y tá, hộ lý, trị liệu nghề nghiệp',
      'Dịch vụ khách hàng, chăm sóc khách hàng, du lịch, nhà hàng – khách sạn',
      'Truyền thông & PR, tổ chức sự kiện, tiếp thị xã hội',
    ],
  },

  E: {
    intro:
      'Nhóm Quản lý (E – Enterprising): Thích lãnh đạo, thuyết phục, khởi xướng và đạt mục tiêu kinh tế hoặc tổ chức.',
    traits: [
      'Năng động, tham vọng, quyết đoán và dám làm thử thách',
      'Giỏi giao tiếp, thuyết phục và xây dựng mạng lưới',
      'Thích cạnh tranh, tinh thần khởi nghiệp cao',
    ],
    strengths: [
      'Quyết đoán, dám nghĩ dám làm',
      'Giao tiếp tốt, thuyết phục và lãnh đạo',
      'Tham vọng, định hướng kết quả và tài chính rõ ràng',
    ],
    weaknesses: [
      'Không kiên nhẫn với quy trình, chi tiết',
      'Dễ nóng vội, bỏ qua bước chuẩn bị cẩn thận',
    ],
    improvements: [
      'Luyện kỹ năng lắng nghe và đặt câu hỏi',
      'Tuân thủ quy trình, lập kế hoạch bài bản',
      'Rèn thói quen suy ngẫm trước khi hứa hay quyết định',
    ],
    careers: [
      'Quản trị doanh nghiệp, lãnh đạo tổ chức, hiệp hội',
      'Marketing & bán hàng, sự kiện, PR, kinh doanh',
      'Nhân sự & phát triển tổ chức, quản lý dự án',
      'Chính sách & quản lý nhà nước, quản lý giáo dục',
      'Khởi nghiệp, lập doanh nghiệp, tư vấn quản lý',
    ],
  },

  C: {
    intro:
      'Nhóm Nghiệp vụ (C – Conventional): Thích làm việc với dữ liệu, con số, quy trình; văn phòng, thống kê, tỉ mỉ và cẩn trọng.',
    traits: [
      'Ngăn nắp, gọn gàng, có kế hoạch chi tiết',
      'Tự giác cao, đúng giờ, cẩn trọng với số liệu',
      'Ưa cấu trúc, tuân thủ hướng dẫn và quy định',
    ],
    strengths: [
      'Được tin tưởng giao trọng trách, tính trách nhiệm cao',
      'Ngăn nắp, tỉ mỉ và chính xác',
      'Thích làm việc với số liệu, hồ sơ và quy trình rõ ràng',
    ],
    weaknesses: [
      'Cầu toàn, dễ căng thẳng khi thay đổi đột ngột',
      'Khó chấp nhận sai sót, dễ mệt mỏi vì yêu cầu cao',
    ],
    improvements: [
      'Rèn thói quen ra quyết định nhanh, bớt cầu toàn',
      'Giảm kỳ vọng không thực tế, chấp nhận lỗi lầm',
      'Tin tưởng nhờ cậy và ủy quyền cho người khác',
    ],
    careers: [
      'Kế toán, kiểm toán, thuế, ngân hàng',
      'Phân tích dữ liệu, thống kê, báo cáo tài chính',
      'Hành chính văn phòng, thư ký, trợ lý hành chính',
      'Quản lý chất lượng, kiểm soát quy trình, logistics',
      'Quản lý hồ sơ, nhập liệu, lưu trữ và kiểm kê',
    ],
  },
};
