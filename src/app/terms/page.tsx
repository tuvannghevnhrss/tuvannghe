import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Điều khoản sử dụng | Tư vấn nghề" };

export default function TermsPage() {
  return (
    <LegalPage title="Điều khoản sử dụng" updated="26/11/2026">
      <p>Khi sử dụng tuvannghe.com, bạn đồng ý với các điều khoản dưới đây.</p>
      <h2>1. Dịch vụ</h2>
      <p>Website cung cấp bài test hướng nghiệp (MBTI, Holland, Knowdell), luyện phỏng vấn với AI và thông tin kết nối tư vấn 1-1. Kết quả mang tính tham khảo, không thay thế quyết định nghề nghiệp của bạn.</p>
      <h2>2. Tài khoản</h2>
      <p>Bạn chịu trách nhiệm bảo mật tài khoản và thông tin đăng nhập của mình, đồng thời cung cấp thông tin chính xác.</p>
      <h2>3. Thanh toán</h2>
      <p>Giá hiển thị trên trang Bảng giá là giá bạn thanh toán (đã gồm mã giảm giá nếu có). Quyền truy cập được kích hoạt sau khi hệ thống xác nhận thanh toán. Xem thêm Chính sách hoàn tiền.</p>
      <h2>4. Nội dung do AI tạo ra</h2>
      <p>Câu hỏi, nhận xét và báo cáo do AI tạo có thể chưa hoàn toàn chính xác. Hãy dùng như gợi ý luyện tập.</p>
      <h2>5. Hành vi không được phép</h2>
      <ul>
        <li>Chia sẻ tài khoản trả phí cho người khác hoặc bán lại quyền truy cập.</li>
        <li>Tấn công, làm gián đoạn hoặc khai thác trái phép hệ thống.</li>
        <li>Tải lên nội dung vi phạm pháp luật hoặc quyền của người khác.</li>
      </ul>
      <h2>6. Thay đổi điều khoản</h2>
      <p>Chúng tôi có thể cập nhật điều khoản này; phiên bản mới có hiệu lực khi được đăng trên website.</p>
      <h2>7. Liên hệ</h2>
      <p>Mọi thắc mắc, vui lòng liên hệ qua trang <a className="text-emerald-700 underline" href="/phongtran">Liên hệ</a>.</p>
    </LegalPage>
  );
}
