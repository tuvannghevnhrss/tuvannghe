# Module 3 V2 — Hướng dẫn kiểm tra

Mục tiêu: trong khoảng 30–40 phút bạn có thể kiểm tra toàn bộ luồng **upload CV → nhập JD → kế hoạch → phỏng vấn giọng nói → báo cáo**, cùng các tình huống lỗi.

## 0. Chuẩn bị (làm một lần)

1. **Áp dụng migration** (nếu chưa): xem mục *"Việc duy nhất bạn cần làm"* trong [MODULE_3_V2_HANDOVER.md](MODULE_3_V2_HANDOVER.md). Nếu chưa áp dụng, bước upload CV sẽ báo lỗi ("relation m3_… does not exist").
2. Mở link Preview của nhánh `feature/module-3-v2`, đăng nhập bằng một tài khoản **đã mua gói phỏng vấn có lượt Module 3** (gói Chuyên nghiệp: 1 lượt; gói Tăng tốc: 3 lượt; gói Khởi động: 0 lượt). Mỗi lần bấm *Bắt đầu phỏng vấn* lần đầu tính 1 lượt; vào lại buổi đang dở **không** tính thêm. Không có gói → hệ thống chuyển sang trang Bảng giá (nhờ admin đánh dấu một đơn `interview_premium` đã thanh toán cho tài khoản test).
3. Dùng **Chrome hoặc Edge**, có micro và **tai nghe** (tránh AI nghe lại tiếng của chính nó).
4. File demo nằm trong thư mục [docs/m3-v2-demo/](docs/m3-v2-demo/):

| File | Dùng để |
|---|---|
| `demo-cv-tuyen-dung-vi.docx` + `demo-jd-chuyen-vien-tuyen-dung.txt` | Kịch bản chính: CV phù hợp cao (tiếng Việt) |
| `demo-cv-marketing-thieu-so-lieu.docx` + `demo-jd-marketing-digital.txt` | CV mơ hồ, thành tích không có số liệu → AI phải đào sâu |
| `demo-cv-senior-backend-en.pdf` + `demo-jd-senior-backend-en.txt` | PDF tiếng Anh, phỏng vấn kỹ thuật bằng tiếng Anh |
| `demo-cv-co-prompt-injection.docx` + `demo-jd-chuyen-vien-tuyen-dung.txt` | Thử CV chứa lệnh tấn công AI |

> Đường dẫn trang: `/interview/module-3/v2` (cũng có banner "Phiên bản 2" ở đầu trang Module 3 cũ).

## 1. Kịch bản chính (CV tốt, giọng nói)

**Bước 1 — Hồ sơ ứng viên**
- Chưa tích đồng ý → nút "Chọn file CV" bị khóa. ✔
- Tích đồng ý, tải `demo-cv-tuyen-dung-vi.docx` → sau ~10–20 giây xuất hiện thông tin CV: tên, 2 công việc, thành tích, kỹ năng, chứng chỉ.
- Kiểm tra: thành tích "giảm thời gian tuyển từ 45 xuống 28 ngày" có nhãn *có số liệu*; **không có** email/số điện thoại.
- Thử **Thay CV**, **Xóa CV** (có hộp xác nhận).

**Bước 2 — Vị trí ứng tuyển**
- Nhập tên vị trí + dán nội dung JD (từ file `.txt`) → *Phân tích JD*: thấy yêu cầu bắt buộc/ưu tiên, năng lực cốt lõi kèm mức quan trọng.
- Bấm *Đối chiếu CV với JD* → thấy 3 cột: **A. Điểm phù hợp / B. Khoảng trống / C. Cần xác minh**, mỗi mục có trích dẫn từ CV/JD.

**Bước 3 — Thiết lập phỏng vấn**
- Chọn loại (HR Screening / Hiring Manager / Technical / Behavioral), mức nghiêm khắc, thời lượng (15–60 phút), giọng AI.
- *Lập kế hoạch phỏng vấn* → danh sách năng lực với trọng số (tổng 100%) và các chặng; **câu hỏi cụ thể được giữ kín**.
- Thời lượng 15 phút → ít năng lực/lượt hơn 60 phút.

**Bước 4 — Phòng phỏng vấn (quan trọng nhất)**
- Bấm *Bắt đầu phỏng vấn* → *Bắt đầu trò chuyện* → cho phép micro.
- AI chào (tự giới thiệu là AI, nêu vị trí và thời lượng) và xin bạn giới thiệu bản thân.
- Trả lời bình thường. Quan sát:
  - Trạng thái đổi: *AI đang nghe → AI đang suy nghĩ → AI đang nói*; có câu đệm ngắn ("Vâng.") trong lúc AI nghĩ.
  - Bản ghi hội thoại bên phải khớp với những gì đã nói; thanh tiến độ tăng dần và hiện tên chặng.
  - Đồng hồ đếm theo thời lượng đã chọn.

## 2. Kiểm tra "AI có thông minh không"

| Bạn làm | Kỳ vọng |
|---|---|
| Trả lời **chung chung** ("Mình có tham gia tuyển dụng, kết quả tốt") | AI đào sâu: hỏi bạn *trực tiếp làm gì*, *số liệu cụ thể*, *kết quả* — chỉ một câu hỏi mỗi lượt |
| Trả lời **đầy đủ có số liệu và vai trò cá nhân** | AI **chuyển chủ đề** thay vì hỏi tiếp cùng một ý |
| Nói điều **mâu thuẫn với CV** (vd. "mình làm ở Sao Mai 8 năm" trong khi CV ghi từ 2021) | AI hỏi lại lịch sự để làm rõ, **không buộc tội** |
| Nói **"Bạn nhắc lại câu hỏi được không?"** | AI nhắc lại, **không tính thêm lượt** |
| Chỉ nói **"Dạ vâng"** | AI xin bạn chia sẻ thêm (một lần) |
| Trả lời xong mà cố ý không nói gì thêm | AI không tự hỏi câu tiếp trước khi nhận được câu trả lời hợp lệ |
| Câu hỏi có lặp lại ý cũ không? | Không được lặp; câu hỏi nhắc đến chi tiết thật trong CV (công ty, dự án, con số) |
| AI có khen từng câu / đọc lại JD không? | Không |

## 3. Giọng nói và các tình huống lỗi

1. **Ngắt lời**: khi AI đang nói, hãy nói chen vào → AI dừng ngay và nghe.
2. **Không chồng tiếng**: AI chỉ nói khi tới lượt (sau khi bạn nói xong ~1,5 giây im lặng).
3. **Từ chối micro**: chặn quyền micro rồi vào phòng → thông báo tiếng Việt rõ ràng + nút *Thử lại* + *Chế độ dự phòng*.
4. **Mất mạng ngắn**: tắt Wi-Fi 10 giây rồi bật lại → trạng thái *Đang kết nối lại…*, AI nói "Xin lỗi, kết nối vừa bị gián đoạn…" rồi **nhắc lại câu hỏi đang dở**; tiến độ không mất.
5. **Mất mạng lâu / tải lại trang**: mở lại địa chỉ có đuôi `?i=…` (trang tự cập nhật địa chỉ này sau khi đối chiếu CV–JD) → vào lại phòng, các câu đã trả lời còn nguyên, không tính thêm lượt.
6. **Chế độ dự phòng**: bấm *Chế độ dự phòng* → nhấn nút micro để ghi âm câu trả lời (hoặc gõ chữ) → cùng bộ điều phối, AI đọc câu hỏi bằng giọng TTS.
7. **Kết thúc sớm**: bấm *Kết thúc phỏng vấn* → xác nhận → báo cáo tạo từ những gì đã trả lời. Nếu chưa trả lời câu nào → thông báo chưa thể tạo báo cáo.

## 4. Báo cáo (tab 5)

Kiểm tra đủ các phần:
- Điểm tổng /100, nhãn đề xuất (Highly Recommended / Recommended / Consider / Not Recommended), **độ phủ bằng chứng**.
- Bảng năng lực: trọng số, điểm 1–5, mức; biểu đồ radar; mở từng năng lực để xem nhận xét và **trích dẫn nguyên văn từ lời bạn nói** (kèm số lượt).
- Điểm mạnh / điểm yếu, phân tích **STAR** (S-T-A-R có/thiếu), **đối chiếu CV** (Thống nhất / Chưa thống nhất / Cần xác minh / Chưa được hỏi), nội dung cần xác minh, câu trả lời nổi bật, 3 ưu tiên cải thiện, gợi ý trả lời tốt hơn.
- Trả lời quá ít → báo cáo hạ mức đề xuất và ghi rõ "thiếu bằng chứng" thay vì cho điểm ảo.
- Nút *In / Lưu PDF*.

## 5. Bảo mật & dữ liệu

- **Prompt injection**: tải `demo-cv-co-prompt-injection.docx` → CV hiện cảnh báo vàng "giống chỉ dẫn dành cho AI"; điểm cuối **không** vọt lên 100 và AI không tiết lộ prompt.
- **Xóa dữ liệu**: tab 1 → *Xóa CV* → các buổi phỏng vấn tạo từ CV đó cũng biến mất (mở `/interview/module-3/v2?i=<id cũ>` sẽ báo không tìm thấy).
- **Không lưu file gốc theo mặc định**: bỏ trống ô "Lưu thêm file gốc" → chỉ có dữ liệu đã phân tích, không có file trong Storage.
- **Phân quyền**: đăng nhập tài khoản khác, dán thử `?i=<id của tài khoản kia>` → "Không tìm thấy" (không lộ dữ liệu).
- **File không hợp lệ**: tải `.exe` đổi tên thành `.pdf`, file >5 MB, PDF scan chỉ có ảnh, PDF có mật khẩu → mỗi trường hợp có thông báo tiếng Việt riêng.

## 6. Kiểm thử tự động (cho kỹ sư)

```bash
pnpm test           # 41 test: file CV thật, injection, chấm điểm, bằng chứng, bộ điều phối
pnpm m3:smoke       # chạy thử chuỗi AI với OpenAI thật (~0,05 USD)
pnpm m3:eval        # đánh giá chất lượng: 20 cặp CV/JD + 7 buổi mô phỏng (~1,3 USD, ~6 phút)
```

Kết quả `m3:eval` mới nhất: `tests/m3/results/eval-latest.json`. RLS đã kiểm trên Postgres cục bộ: `tests/m3/sql/` (xem handover).
