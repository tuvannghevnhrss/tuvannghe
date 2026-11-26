export type BlogCategory = 'MBTI' | 'Holland' | 'Tips';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  audience: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'huong-nghiep-cap-3',
    title: 'Hướng nghiệp từ cấp 3 - Bí quyết chọn nghề phù hợp với bản thân',
    excerpt:
      'Từ việc hiểu rõ bản thân đến lập kế hoạch học tập, đây là lộ trình giúp học sinh cấp 3 chọn nghề tự tin và đúng hướng.',
    category: 'Tips',
    date: '2025-01-12',
    readTime: '6 phút đọc',
    audience: 'Học sinh cấp 3',
  },
  {
    slug: 'cach-xac-dinh-nghe',
    title: 'Cách xác định nghề nghiệp tương lai phù hợp với học sinh cấp 3',
    excerpt:
      '5 bước thực tế: khám phá sở thích - năng lực, hỏi chuyên gia, trải nghiệm ngoại khóa và lên kế hoạch học tập.',
    category: 'Holland',
    date: '2025-01-20',
    readTime: '5 phút đọc',
    audience: 'Người đang chọn ngành',
  },
];

export const blogCategories: Array<'Tất cả' | BlogCategory> = ['Tất cả', 'MBTI', 'Holland', 'Tips'];

export const blogFAQs = [
  {
    question: 'Blog này phù hợp với ai?',
    answer:
      'Phù hợp với học sinh, sinh viên, người đi làm muốn đổi hướng và phụ huynh đang tìm tài nguyên hướng nghiệp dễ hiểu, có thể áp dụng ngay.',
  },
  {
    question: 'Blog có bài về MBTI, Holland và Knowdell không?',
    answer:
      'Có. Nội dung được xây quanh các cụm keyword hướng nghiệp phổ biến như MBTI, Holland (RIASEC), Knowdell và luyện phỏng vấn AI.',
  },
  {
    question: 'Tôi nên đọc trang nào trước nếu muốn chọn nghề?',
    answer:
      'Nên bắt đầu từ trang Career để hiểu bản thân, sau đó sang Blog để đọc kiến thức cụ thể và cuối cùng xem Interview nếu bạn muốn luyện trả lời phỏng vấn.',
  },
  {
    question: 'Nội dung blog được trình bày như thế nào?',
    answer:
      'Mỗi bài được chia thành các mục rõ ràng, có câu hỏi thường gặp và liên kết tới các công cụ MBTI, Holland, Knowdell và luyện phỏng vấn để bạn đọc xong có thể thực hành ngay.',
  },
];

export const blogExploreLinks = [
  {
    href: '/career',
    title: 'Hướng nghiệp AI',
    description: 'Khám phá MBTI, Holland, Knowdell và lộ trình chọn nghề phù hợp.',
  },
  {
    href: '/interview',
    title: 'Luyện phỏng vấn AI',
    description: 'Từ mock interview đến live interview và realtime coaching.',
  },
  {
    href: '/pricing',
    title: 'Bảng giá',
    description: 'Xem chi phí gói hướng nghiệp và luyện phỏng vấn AI.',
  },
  {
    href: '/mbti',
    title: 'Trắc nghiệm MBTI',
    description: 'Bắt đầu bằng bài test tính cách để hiểu cách bạn làm việc tốt nhất.',
  },
];

export const blogReadingPaths = [
  {
    label: 'Chưa biết mình hợp nghề gì',
    title: 'Bắt đầu từ hiểu bản thân',
    description: 'Làm bài test và đọc các hướng dẫn nền tảng trước khi chọn ngành.',
    href: '/career',
    cta: 'Khám phá hướng nghiệp',
  },
  {
    label: 'Đang chọn ngành học',
    title: 'Xác định nhóm nghề phù hợp',
    description: 'Dùng Holland và các ví dụ thực tế để thu hẹp lựa chọn.',
    href: '/blog/cach-xac-dinh-nghe',
    cta: 'Đọc hướng dẫn',
  },
  {
    label: 'Sắp đi phỏng vấn',
    title: 'Luyện trả lời có phản hồi',
    description: 'Chuyển từ đọc kiến thức sang luyện tập với AI interviewer.',
    href: '/interview',
    cta: 'Luyện phỏng vấn',
  },
];
