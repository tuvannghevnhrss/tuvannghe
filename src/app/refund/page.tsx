import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Chính sách hoàn tiền | Tư vấn nghề" };

export default function RefundPage() {
  return (
    <LegalPage title="Chính sách hoàn tiền" updated="26/11/2026">
      <p>Các sản phẩm của chúng tôi là dịch vụ số, được kích hoạt ngay sau khi thanh toán thành công.</p>
      <h2>Các trường hợp được hoàn tiền</h2>
      <ul>
        <li>Bạn bị trừ tiền nhiều lần cho cùng một đơn.</li>
        <li>Bạn đã thanh toán nhưng sản phẩm không được kích hoạt và chúng tôi không khắc phục được.</li>
        <li>Lỗi hệ thống khiến bạn không thể sử dụng sản phẩm đã mua.</li>
      </ul>
      <h2>Các trường hợp không hoàn tiền</h2>
      <ul>
        <li>Bạn đã sử dụng phần lớn lượt luyện hoặc đã xem kết quả của sản phẩm.</li>
        <li>Bạn không hài lòng với nhận xét của AI trong khi dịch vụ hoạt động bình thường.</li>
      </ul>
      <h2>Cách yêu cầu hoàn tiền</h2>
      <p>Hãy liên hệ qua trang <a className="text-emerald-700 underline" href="/phongtran">Liên hệ</a>, kèm email tài khoản và mã đơn (hiển thị ở trang thanh toán). Chúng tôi sẽ phản hồi và xử lý theo từng trường hợp.</p>
    </LegalPage>
  );
}
