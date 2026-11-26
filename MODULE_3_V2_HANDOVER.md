# Module 3 V2 — Bàn giao

Nhánh: `feature/module-3-v2` (chưa merge vào `main`, chưa deploy production).
Hướng dẫn kiểm tra từng tính năng: [MODULE_3_V2_TESTING_GUIDE.md](MODULE_3_V2_TESTING_GUIDE.md).

## ⚠️ Việc duy nhất bạn cần làm trước khi thử Demo

**Áp dụng migration database.** Tôi đã thử chạy lệnh này lên Supabase đang dùng nhưng hệ thống phân quyền của phiên làm việc **chặn** (thay đổi database production cần bạn xác nhận), nên migration **chưa được áp dụng**. Preview dùng chung database này nên chưa tải được CV cho tới khi bạn chạy một trong hai cách:

```bash
# Cách 1 — Supabase CLI (đã đăng nhập sẵn trên máy này)
supabase db query --linked --project-ref wnyqmvhvyxvwsthkndxs -f supabase/migrations/20261126_m3_v2_interview.sql

# Cách 2 — dán nội dung file trên vào Supabase Dashboard → SQL Editor → Run
```

Migration này **chỉ thêm** 7 bảng `m3_*`, 1 hàm `m3_purge_expired`, 1 bucket riêng tư `m3-cv` và các policy RLS; **không sửa/xóa** bảng hiện có và an toàn khi chạy lại. Rollback: `supabase/rollbacks/20261126_m3_v2_interview_down.sql`. Đã kiểm tra trên Postgres cục bộ (xem *Kết quả kiểm thử*).

Ngoài ra môi trường **Preview** trên Vercel cần có (tôi không có quyền xem danh sách biến môi trường nên chưa xác nhận được): `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nếu thiếu, bật các biến này cho scope *Preview* rồi Redeploy. Tài khoản thử cần gói có lượt Module 3 (xem hướng dẫn kiểm tra).

## 1. Kiến trúc mới

```
CV (PDF/DOCX) ─┐
               ├─► Phân tích (JSON schema) ─► Đối chiếu CV–JD ─► Kế hoạch phỏng vấn ─┐
JD (văn bản) ──┘                                                                      │
                                                                                      ▼
 Realtime Voice ─► Transcript ─► Orchestrator (+ Evidence Tracker) ─► Câu hỏi ─► Realtime Voice
   (đọc nguyên văn)                  máy chủ, structured output                (không tự quyết định)
                                                                                      │
                                                                                      ▼
                                                              Evaluator ─► Báo cáo có bằng chứng
```

Nguyên tắc: **một bộ não duy nhất** ở máy chủ (`src/lib/m3/`). Lớp giọng nói chỉ "đọc" câu hỏi do Orchestrator tạo (`create_response=false`); pipeline dự phòng (ghi âm/gõ chữ) dùng **cùng** Orchestrator và cùng bảng dữ liệu.

| Thành phần | File | Việc làm |
|---|---|---|
| Cấu hình tập trung | `src/lib/m3/config.ts` | Model, giới hạn, giá ước tính, thời lượng → số lượt |
| Schema | `schemas.ts` | Zod schema cho CV, JD, đối chiếu, kế hoạch, quyết định điều phối, đánh giá |
| File CV | `files.ts` | Kiểm tra magic bytes + MIME, trích chữ PDF (`unpdf`) / DOCX (`mammoth`) |
| Phân tích | `analysis.ts` | CV→JSON, JD→JSON, đối chiếu; xác minh mọi trích dẫn có thật trong nguồn; khoảng trống thời gian tính bằng code |
| Planner | `planner.ts` | Kế hoạch: năng lực (trọng số theo JD) + chặng + câu gợi ý; chuẩn hóa theo thời lượng |
| Orchestrator + Evidence Tracker | `orchestrator.ts` | Mỗi lượt: đánh giá câu trả lời → thu bằng chứng (trích dẫn xác minh) → chọn hành động → sinh câu hỏi; bộ nhớ, chống lặp, giới hạn đào sâu, chuyển chặng, kết thúc |
| Persona | `persona.ts` | Lời chào/kết, nhắc lại, câu đệm, chỉ dẫn cho lớp giọng nói |
| Evaluator | `evaluator.ts`, `scoring.ts` | Điểm 1–5 theo năng lực, STAR, đối chiếu CV, báo cáo; **điểm tổng và đề xuất do code tính** |
| Bảo mật | `security.ts` | Phát hiện/vô hiệu hóa prompt injection, bọc dữ liệu không đáng tin |
| LLM | `llm.ts` | Structured output + kiểm tra schema + thử lại + ghi usage + trần chi phí |

### Quyết định điều phối từng lượt
Schema (`OrchestratorSchema`) gồm `action` (`follow_up | probe_gap | challenge_cv | next_topic | clarify | wrap_up`), `competency`, `reason`, `answer_assessment`, `evidence[]` (trích nguyên văn), `missing_evidence`, `cv_conflict`, `question`, `next_focus`. `coverage_update` được **máy chủ tính** từ bằng chứng đã xác minh (không tin model). Model trả JSON sai định dạng → thử lại 1 lần → báo lỗi rõ (không lỗi âm thầm).

### Chống ảo giác và chấm điểm công bằng
- Trích dẫn trong CV/JD/bằng chứng/báo cáo đều được kiểm tra có thật trong nguồn; không có → bị xóa và đếm vào `dropped_quotes`.
- Năng lực không có trích dẫn hợp lệ không được điểm cao (≤ 2) và bị đánh dấu *thiếu bằng chứng*.
- Điểm tổng chỉ tính trên năng lực **đã có bằng chứng**; `coverage` (độ phủ) hiển thị riêng. Độ phủ < 60% → đề xuất tối đa *Consider*. Phát hiện sau lần chạy đánh giá đầu: nếu tính năng lực chưa được hỏi như "điểm thấp" thì cùng một ứng viên giỏi dao động 44↔81 điểm — đã sửa.
- Khác biệt chưa được xác minh với CV chỉ là *Cần xác minh*, không bao giờ kết luận gian dối; "Chưa thống nhất" chỉ khi có trích dẫn mâu thuẫn thật.

## 2. Model đang dùng (đổi bằng biến môi trường, không hardcode)

| Việc | Biến | Mặc định |
|---|---|---|
| Trích xuất CV/JD | `M3_MODEL_EXTRACT` | `gpt-4.1-mini` |
| Đối chiếu CV–JD | `M3_MODEL_MATCH` | `gpt-4.1` |
| Lập kế hoạch | `M3_MODEL_PLAN` | `gpt-4.1` |
| Điều phối từng lượt (nhanh) | `M3_MODEL_ORCHESTRATOR` | `gpt-4.1-mini` |
| Đánh giá cuối | `M3_MODEL_EVALUATE` | `gpt-4.1` |
| Giọng nói thời gian thực (GA) | `M3_MODEL_REALTIME` | `gpt-realtime` |
| Nhận dạng giọng nói | `M3_MODEL_TRANSCRIBE` | `gpt-4o-mini-transcribe` |
| Trần chi phí AI mỗi buổi (USD) | `M3_MAX_COST_PER_INTERVIEW_USD` | `1.5` |
| Bảo vệ endpoint dọn dữ liệu | `CRON_SECRET` | (không có → endpoint từ chối) |

Tài khoản OpenAI hiện có cả `gpt-realtime-2.1`; có thể thử bằng `M3_MODEL_REALTIME=gpt-realtime-2.1` (đã xác nhận API chấp nhận cấu hình phiên).

## 3. Database (migration `20261126_m3_v2_interview.sql`)

`m3_cv_documents`, `m3_job_descriptions`, `m3_interviews` (config/match/plan/state), `m3_messages`, `m3_competency_evidence`, `m3_evaluations`, `m3_ai_usage` + bucket riêng tư `m3-cv`. Tái dùng `interview_sessions_v2` để tính **hạn mức Module 3** như cũ (module_type = 2, ghi `config.v2=true`). RLS: chủ sở hữu mới đọc/ghi; tin nhắn/bằng chứng/đánh giá/usage chỉ đọc từ phía người dùng (ghi bằng service role ở máy chủ, luôn kèm kiểm tra `user_id`). Xóa CV ⇒ xóa file gốc + dữ liệu phân tích + các buổi phỏng vấn liên quan (cascade). Dữ liệu tự hết hạn sau 30 ngày (`expires_at`); hàm `m3_purge_expired()` dọn qua `POST /api/interview/m3/maintenance/purge` (cần `Authorization: Bearer $CRON_SECRET`). **Chưa đăng ký cron** trong `vercel.json` (để tránh đổi cấu hình production) — thêm khi muốn chạy tự động hằng ngày.

Quyền riêng tư: bắt buộc tích đồng ý trước khi tải CV (ghi `consent_at`); mặc định **không** lưu file gốc; email/SĐT không được trích xuất.

## 4. API

Mới (đều dưới `/api/interview/m3/`, yêu cầu đăng nhập, kiểm tra quyền sở hữu): `documents` (GET, POST multipart), `documents/[id]` (GET, DELETE), `jobs` (GET, POST), `jobs/[id]` (GET, DELETE), `interviews` (GET, POST tạo + đối chiếu), `interviews/[id]` (GET, PATCH, DELETE), `…/plan`, `…/start` (cũng dùng để tiếp tục/reconnect), `…/realtime` (cấp ephemeral key), `…/turn` (JSON hoặc audio; idempotent), `…/complete`, `maintenance/purge`.
Giữ nguyên: mọi API cũ (Module 1/2, `/api/interview/module-3/*`, payment). Trang cũ `/interview/module-3` chỉ thêm banner dẫn sang V2.

## 5. File

**Tạo mới:** `src/lib/m3/*` (13 file), `src/app/api/interview/m3/**` (12 route), `src/app/interview/module-3/v2/page.tsx`, `src/components/interview/m3/*` (9 file), `supabase/migrations/20261126_m3_v2_interview.sql`, `supabase/rollbacks/20261126_m3_v2_interview_down.sql`, `tests/m3/*` (+ `sql/`), `scripts/m3-smoke.ts`, `scripts/m3-eval.ts`, `scripts/m3-make-demo-files.ts`, `docs/m3-v2-demo/*`, `vitest.config.mts`, hai file MODULE_3_V2_*.md.
**Sửa:** `src/app/interview/module-3/page.tsx` (banner), `package.json`/`pnpm-lock.yaml` (thêm `unpdf`, `mammoth`, `vitest`, `tsx`; script `test`, `m3:smoke`, `m3:eval`, `m3:demo-files`).
Nhánh còn chứa commit sửa lỗi website của lượt làm việc trước (`1aa4a16`).

## 6. Kết quả kiểm thử

**Tự động (`pnpm test`): 41/41 đạt** — upload PDF/DOCX **thật** (tạo file thật rồi trích chữ), từ chối ZIP/giả danh/rỗng/quá lớn/PDF scan/file hỏng, injection (EN+VI, không báo nhầm), chấm điểm và trọng số, xác minh bằng chứng, phân bổ lượt theo thời lượng, bộ điều phối (nhắc lại không tính lượt, chống lặp, trần đào sâu, chuyển chặng, hết giờ → ứng viên hỏi → kết thúc, bọc dữ liệu), cấu trúc 20 fixture.

**RLS (Postgres cục bộ, `tests/m3/sql/`): đạt** — B không đọc/ghi/xóa/sửa được dữ liệu của A, không ghi mạo danh, không gọi được hàm dọn dữ liệu, xóa CV cascade đúng, purge hoạt động, migration chạy lại không lỗi. *Chưa kiểm trên database Supabase thật (xem mục trên).*

**Realtime GA với OpenAI thật (WebSocket): đạt** — cấu hình phiên được chấp nhận (`create_response=false`), AI đọc **đúng nguyên văn** câu hỏi, ứng viên nói tiếng Việt → nhận transcript, **không** tự trả lời khi không có chỉ dẫn; tên sự kiện khớp code.

**Chất lượng AI (OpenAI thật, `pnpm m3:eval`, dữ liệu giả lập; `tests/m3/results/eval-final.json`):**

| Chỉ số | Kết quả |
|---|---|
| 20 cặp CV/JD: phân tích → đối chiếu → kế hoạch | 20/20 thành công, 20/20 kế hoạch hợp lệ (trọng số=1, đủ chặng đầu/cuối) |
| Phát hiện injection | CV có injection bị gắn cờ; 0/19 CV/JD bình thường bị báo nhầm |
| Khoảng trống thời gian (CV #5) | phát hiện 2 khoảng trống |
| 7 buổi mô phỏng đầy đủ | 7/7 hoàn tất, không câu hỏi lặp (độ giống tối đa 0,59) |
| Câu hỏi bám CV / bám JD (giám khảo AI, 1–5) | 4,4 / 4,7 (cao hơn ở các buổi ứng viên trả lời bình thường) |
| Chất lượng đào sâu / tự nhiên (1–5) | 4,1 / 5,0 |
| Dữ kiện bịa trong câu hỏi | 0 buổi |
| Đánh giá có căn cứ (1–5) | 5,0; bằng chứng được xác minh 96% (phần còn lại bị loại tự động) |
| Ứng viên trả lời **kịch bản kém** (ngắn / lan man / mâu thuẫn CV) | cả 3 bị chấm 0/100, Not Recommended |
| Mâu thuẫn với CV | được phát hiện (1 mục "Chưa thống nhất" có trích dẫn) |
| **Đối chứng injection** (cùng transcript, CV có/không có lệnh chèn) | điểm 95 và 95 (lệch 0), không lộ prompt |
| Độ trễ bộ điều phối | 3,3 giây/lượt (đã giảm từ 4,1 giây; cộng câu đệm giọng nói để che độ trễ) |
| Chi phí (ước tính theo token) | ≈ 0,10–0,15 USD cho cả quy trình một buổi 15 phút (phân tích CV/JD, đối chiếu, kế hoạch, điều phối, đánh giá), **chưa gồm** giọng nói Realtime; cả bộ thử 146 lệnh gọi ≈ 1,3 USD |

Lưu ý trung thực về phương pháp: ứng viên "tốt/bình thường" do AI đóng vai nên mang tính mô phỏng; giám khảo AI từng **báo nhầm** "làm theo injection" ở 6 buổi không có injection (trường này chỉ để tham khảo, thay bằng phép đối chứng ở trên). Chưa có đánh giá bởi người thật.

**Build:** `next build` thành công; `tsc --noEmit` sạch.

**Realtime đã kiểm bằng WebSocket** (cùng giao thức sự kiện), **chưa** kiểm bằng WebRTC trong trình duyệt.

## 7. Giới hạn và lỗi đã biết

- **Chưa kiểm thử được trên trình duyệt thật:** giọng nói WebRTC (micro, ngắt lời, reconnect), toàn bộ 5 tab và luồng đăng nhập chưa được thao tác bằng người/trình duyệt tự động (không có micro/tài khoản test trong môi trường làm việc). Các hành vi này đã được viết theo tài liệu OpenAI và kiểm các phần máy chủ/sự kiện ở trên, nhưng **cần bạn chạy theo hướng dẫn kiểm tra**; nếu có lỗi giao diện/âm thanh, đây là nơi nhiều khả năng xuất hiện (`useInterviewRoom.ts`).
- Sự kiện `output_audio_buffer.stopped` (WebRTC) chưa kiểm thử trực tiếp; code có bộ đếm giờ dự phòng.
- Độ trễ mỗi lượt vẫn ~3–4 giây (Orchestrator + nhận dạng), đã che bằng câu đệm; muốn nhanh hơn có thể thử model nhỏ hơn cho Orchestrator.
- CV dạng ảnh/scan (không có chữ) bị từ chối với thông báo rõ; **chưa có OCR**.
- Chưa có màn hình liệt kê các buổi phỏng vấn cũ trong giao diện (API `GET /interviews` đã có; mở lại bằng địa chỉ `?i=<id>`).
- Chưa đăng ký cron dọn dữ liệu hết hạn (xem mục 3).
- Chưa có kiểm thử end-to-end tự động trên trình duyệt (Playwright) và chưa thử độ chịu tải.
- Chưa làm: tích hợp báo cáo V2 vào trang `Tiến độ`/lịch sử cũ; chia sẻ báo cáo cho nhà tuyển dụng.

## 8. Demo

File mẫu trong `docs/m3-v2-demo/` (CV giả lập .docx/.pdf + JD .txt). Tài khoản thử: **chưa tạo** (không tạo tài khoản mới trên hệ thống thật); dùng tài khoản của bạn có lượt Module 3.

## 9. Preview Deployment

- Đã đẩy nhánh `feature/module-3-v2` lên GitHub; Vercel build **thành công** (commit `72bc564`). Production (`main`) không bị đụng tới.
- Địa chỉ Preview (alias theo nhánh): **https://tuvannghe-git-feature-module-3-v2-newvercels-projects-c0eadd06.vercel.app/interview/module-3/v2**
- Preview đang bật **Vercel Authentication**: bạn cần đăng nhập Vercel (tài khoản trong team) để mở; vì vậy tôi **chưa thể** tự mở trang Preview để kiểm tra giao diện. Đã xác nhận bản build của route `/interview/module-3/v2` và 12 API m3 có mặt, và (chạy `next start` cục bộ) trang trả 200, API chưa đăng nhập trả 401, endpoint dọn dữ liệu trả 403 khi thiếu secret.
- Việc còn lại để Demo chạy được thật: **áp dụng migration** (đầu file) → đăng nhập tài khoản có lượt Module 3 → làm theo hướng dẫn kiểm tra.
- Mở PR: https://github.com/tuvannghevnhrss/tuvannghe/pull/new/feature/module-3-v2 (chưa tạo; không merge/deploy production khi chưa có đồng ý của bạn).
