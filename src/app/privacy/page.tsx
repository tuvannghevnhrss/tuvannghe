import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Chính sách bảo mật | Tư vấn nghề" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Chính sách bảo mật" updated="26/11/2026">
      <p>Chúng tôi coi trọng dữ liệu cá nhân của bạn. Trang này giải thích dữ liệu nào được thu thập và dùng vào việc gì.</p>
      <h2>1. Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li>Thông tin tài khoản: email, tên, ảnh đại diện (khi đăng nhập bằng email, Google hoặc Facebook).</li>
        <li>Kết quả bài test: MBTI, Holland, Knowdell và hồ sơ hướng nghiệp.</li>
        <li>Dữ liệu luyện phỏng vấn: câu trả lời, bản ghi âm giọng nói, bản chép lời và nhận xét của AI. Nội dung JD/CV bạn dán vào để cá nhân hóa câu hỏi.</li>
        <li>Thông tin thanh toán: sản phẩm đã mua, số tiền, mã đơn. Chúng tôi không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn.</li>
      </ul>
      <h2>2. Mục đích sử dụng</h2>
      <ul>
        <li>Cung cấp, lưu và hiển thị kết quả, báo cáo cho chính bạn.</li>
        <li>Tạo câu hỏi và nhận xét bằng AI. Nội dung liên quan được gửi tới nhà cung cấp dịch vụ AI và chuyển giọng nói thành văn bản để xử lý.</li>
        <li>Xác nhận thanh toán và hỗ trợ khi có sự cố.</li>
      </ul>
      <h2>3. Chia sẻ dữ liệu</h2>
      <p>Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ với nhà cung cấp hạ tầng, AI và thanh toán ở mức cần thiết để vận hành dịch vụ, hoặc khi pháp luật yêu cầu.</p>
      <h2>4. Quyền của bạn</h2>
      <p>Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân và bản ghi âm của mình bằng cách liên hệ với chúng tôi.</p>
      <h2>5. Liên hệ</h2>
      <p>Vui lòng liên hệ qua trang <a className="text-emerald-700 underline" href="/phongtran">Liên hệ</a>.</p>
    </LegalPage>
  );
}
