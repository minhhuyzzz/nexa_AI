# MA TRẬN TEST CASES KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST CASES MATRIX)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-TEST-CASES`
- **Phiên bản:** `v3.2.0` (Bao phủ đầy đủ 28 Test Cases Trọng yếu cho B2C/B2B, 4 Hình thức Thi, 5 Ứng dụng AI, Link/PIN/QR, Nhận xét Nhóm, Rank Top 100+ & Xuất Dữ liệu Nghiên cứu)
- **Mức độ ưu tiên:** `P1` (Bắt buộc vượt qua 100% trước khi phát hành), `P2` (Quan trọng)

---

## 1. PHÂN HỆ ĐỊNH DANH & CỐ ĐỊNH VAI TRÒ (`IDENTITY & ACCESS`)

| Mã TC | Tên Trường hợp Kiểm thử | Ưu tiên | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :-: | :--- | :--- |
| **`TC-AUTH-01`** | Khách vãng lai tự đăng ký vai trò `LEARNER` hoặc `EVALUATOR` kèm NĐ 13 | **P1** | 1. Mở `/register`, chọn vai trò `EVALUATOR`.<br>2. Tích chọn cam kết NĐ 13 và xác thực OTP. | Tạo tài khoản `EVALUATOR`, lưu `consent_logs`, kích hoạt gói Free và vào thẳng `/evaluator/dashboard`. |
| **`TC-AUTH-02`** | Ngăn chặn thay đổi vai trò tĩnh sau khi đã đăng ký (`BR-AUTH-02`) | **P1** | 1. Dùng tài khoản `LEARNER` gửi yêu cầu cập nhật `role = 'EVALUATOR'` hoặc `'ADMIN'`. | Trigger `trg_lock_static_role` của PostgreSQL chặn ngay lập tức và trả về lỗi `403 Forbidden`. |
| **`TC-AUTH-03`** | Khóa tạm thời khi đăng nhập sai mật khẩu 5 lần liên tiếp | **P2** | 1. Nhập sai mật khẩu 5 lần tại `/login`. | Hệ thống trả về `429 Too Many Requests` và tạm khóa đăng nhập trong 15 phút. |

---

## 2. PHÂN HỆ NHÓM HỌC TẬP, NHẬN XÉT NHÓM & PHÒNG THI TRỰC TIẾP (`GROUPS & LIVE ROOM`)

| Mã TC | Tên Trường hợp Kiểm thử | Ưu tiên | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :-: | :--- | :--- |
| **`TC-GRP-01`** | Tham gia Nhóm học tập tự động qua đường Link `?join=CODE` hoặc QR | **P1** | 1. Người học bấm vào đường dẫn `/learner/groups?join=K24DIG`. | Hệ thống tự động đọc mã `K24DIG`, thêm người học vào `group_members` và mở giao diện nhóm. |
| **`TC-GRP-02`** | Người đánh giá gửi lời nhận xét trực tiếp cho Người học trong nhóm | **P1** | 1. Evaluator vào `/evaluator/groups`, chọn học viên và gửi nhận xét.<br>2. Học viên mở `/learner/groups`. | Bản ghi lưu vào `group_feedbacks`, chuông thông báo của học viên sáng lên và hiển thị đúng nội dung nhận xét. |
| **`TC-LIVE-01`** | Vào Phòng thi trực tiếp ở chế độ **Mở (`OPEN`)** không cần thuộc nhóm | **P1** | 1. Evaluator mở phòng thi chế độ `OPEN` (PIN `849201`).<br>2. Người học tự do bấm link `/learner/live-pin?pin=849201`. | Người học vào thẳng Phòng chờ thi trực tiếp mà không bị chặn bởi điều kiện thành viên nhóm. |
| **`TC-LIVE-02`** | Chặn người lạ vào Phòng thi chế độ **Nội bộ Nhóm (`GROUP_ONLY`)** | **P2** | 1. Evaluator mở phòng thi chế độ `GROUP_ONLY`.<br>2. Người học ngoài nhóm nhập PIN. | Hệ thống trả về `403 Forbidden` và thông báo phòng thi chỉ dành cho thành viên của nhóm. |

---

## 3. PHÂN HỆ KHẢO THÍ 4 HÌNH THỨC & RÀNG BUỘC RUBRIC (`ASSESSMENT ENGINE`)

| Mã TC | Tên Trường hợp Kiểm thử | Ưu tiên | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :-: | :--- | :--- |
| **`TC-ASM-01`** | Chặn lưu câu hỏi khi tổng trọng số Rubric khác 100% (`BR-RUBRIC-01`) | **P1** | 1. Tạo câu hỏi `PRACTICAL_TASK` có 2 tiêu chí trọng số 40% và 50% (tổng 90%). | Zod Schema báo lỗi `422 Unprocessable Entity`, yêu cầu tổng trọng số phải đúng bằng 100%. |
| **`TC-ASM-02`** | Ràng buộc bắt buộc đối với câu hỏi Sản phẩm & Minh chứng số (`BR-EXAM-04`) | **P1** | 1. Tại câu `DIGITAL_EVIDENCE`, tải tệp PDF nhưng chỉ viết giải trình 10 từ.<br>2. Bấm Nộp bài. | Hệ thống chặn nộp bài và nhắc nhở văn bản giải trình phương án phải có tối thiểu 30 từ. |
| **`TC-ASM-03`** | Tự động lưu nháp 15 giây lên Redis & Khôi phục khi tải lại trang | **P1** | 1. Làm câu hỏi `MCQ` và `SCENARIO`, chờ 15s.<br>2. Bấm `F5` tải lại trang phòng thi. | Toàn bộ đáp án đã chọn và đoạn văn đang gõ được khôi phục nguyên vẹn từ Upstash Redis. |
| **`TC-ASM-04`** | Cưỡng chế thu bài tự động khi đồng hồ chạm `00:00` | **P1** | 1. Để thời gian làm bài đếm ngược về `00:00`. | Khóa giao diện làm bài, tự động gửi dữ liệu lưu nháp gần nhất lên máy chủ và chuyển sang chấm điểm. |

---

## 4. PHÂN HỆ 5 ỨNG DỤNG AI, LỘ TRÌNH 4 BƯỚC & BẢNG XẾP HẠNG (`AI, PATHWAY & RANK`)

| Mã TC | Tên Trường hợp Kiểm thử | Ưu tiên | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :-: | :--- | :--- |
| **`TC-AI-01`** | Khử sạch thông tin định danh cá nhân (PII) trước khi gọi AI (`BR-AI-01`) | **P1** | 1. Người học viết SĐT `0901234567` và email trong bài giải trình.<br>2. Kiểm tra payload gửi tới Adapter AI. | Chuỗi SĐT và email bị thay thế bằng `[REDACTED_PII]`, không gửi tên thật hay email của người học. |
| **`TC-AI-02`** | Thực thi `AI Call #1` (Ứng dụng AI 1): Chấm Rubric kèm trích dẫn bằng chứng | **P1** | 1. Nộp bài thực hành hợp lệ.<br>2. Kiểm tra bản ghi `ai_evaluation_logs`. | Trả về JSON có đủ điểm từng tiêu chí, trường `evidenceQuote` trích dẫn đúng bài làm và `confidenceScore`. |
| **`TC-AI-03`** | Phân luồng Cờ Xanh (`>= 0.85`) vs Cờ Cam/Đỏ (`< 0.85`) giữa B2C và B2B | **P1** | 1. Chạy bài tự đánh giá B2C có `confidenceScore = 0.90`.<br>2. Chạy bài nhóm có `confidenceScore = 0.68`. | Bài B2C tự động công bố kết quả ngay; bài nhóm gắn `needs_manual_review = true` đẩy vào bàn chấm Evaluator. |
| **`TC-AI-04`** | Thực thi `AI Call #2` (Ứng dụng AI 2, 3, 4, 5): Mạnh/Yếu, Khoảng trống, Phản hồi & Lộ trình | **P1** | 1. Phiên thi có Kỹ năng `4.2` đạt `45/100` điểm (`< 60`).<br>2. Kiểm tra `ai_analysis` & `learning_pathways`. | Ghi nhận `4.2` vào `skillGaps`, sinh phản hồi cá nhân hóa và tạo lộ trình 3 chặng chỉ lấy từ `learning_content_items` có thật trong CSDL. |
| **`TC-AI-05`** | Đổi nhà cung cấp AI (`GEMINI` $\leftrightarrow$ `OPENAI` $\leftrightarrow$ `CLAUDE`) & Bài mẫu chuẩn | **P2** | 1. Admin đổi `active_provider = 'OPENAI'` tại `/admin/ai-gateway` và đánh dấu 1 bài làm là `is_gold_sample = true`. | Lượt chấm tiếp theo gọi qua `OpenAIModelAdapter` và đính kèm bài mẫu chuẩn vào ngữ cảnh Prompt. |
| **`TC-PATH-01`** | Hoàn thành học liệu trong Lộ trình 4 bước, cộng `+30 điểm (point)` & Mở khóa Đánh giá lại | **P1** | 1. Học viên bấm hoàn thành học liệu tại `/learner/learning-path`. | Cộng `+30 điểm (point)` (lần đầu), cập nhật Bảng xếp hạng Top 100+ và mở khóa nút *"Đánh giá lại kỹ năng"*. |
| **`TC-RANK-01`** | Hiển thị Bảng xếp hạng Rank Top 100+ siêu tốc (`< 100ms`) | **P2** | 1. Truy cập `/learner/leaderboard`. | Trả về danh sách Top 100+ người học sắp xếp theo `points DESC` và hiển thị đúng thứ hạng hiện tại của bản thân. |

---

## 5. PHÂN HỆ KHUNG NĂNG LỰC ĐỘNG, CHỨNG CHỈ & XUẤT DỮ LIỆU NGHIÊN CỨU (`ADMIN & EXPORT`)

| Mã TC | Tên Trường hợp Kiểm thử | Ưu tiên | Các bước thực hiện | Kết quả kỳ vọng |
| :--- | :--- | :-: | :--- | :--- |
| **`TC-ADM-01`** | Cập nhật Khung năng lực số động không làm sai lệch bài thi cũ | **P1** | 1. Admin thêm kỹ năng mới hoặc tạo phiên bản khung mới tại `/admin/framework-engine`. | Các đề thi tạo mới hiển thị danh sách kỹ năng mới; các bài thi cũ vẫn giữ nguyên bảng điểm và chứng chỉ theo khung cũ. |
| **`TC-CRD-01`** | Cấp chứng chỉ PDF Vector có mã băm SHA-256 kép & Quét QR tại `/verify/[id]` | **P1** | 1. Cấp chứng chỉ cho phiên thi đạt chuẩn.<br>2. Mở đường dẫn `/verify/[credentialId]`. | Lưu đủ `data_hash` và `file_hash`; trang `/verify/[id]` hiển thị trạng thái Hợp lệ (`VALID`) và biểu đồ năng lực. |
| **`TC-CRD-02`** | Thu hồi chứng chỉ (`Revocation`) hiển thị cảnh báo đỏ tức thì | **P1** | 1. Admin thu hồi chứng chỉ tại `/admin/credentials`.<br>2. Tải lại trang `/verify/[credentialId]`. | Trang xác thực chuyển sang khung cảnh báo Đỏ (`REVOKED`) kèm lý do thu hồi và ghi nhận vào `audit_logs`. |
| **`TC-EXP-01`** | Evaluator xuất bảng dữ liệu khảo thí nhóm ra tệp Excel / CSV | **P1** | 1. Evaluator bấm *"Xuất Excel/CSV"* tại `/evaluator/analytics`. | Tải xuống tệp `.xlsx`/`.csv` chứa đầy đủ điểm tổng, điểm từng miền, điểm từng câu và nhận xét của cả nhóm. |
| **`TC-EXP-02`** | Admin xuất Bộ dữ liệu Nghiên cứu ẩn danh (`Research Dataset Export`) | **P1** | 1. Admin bấm *"Xuất Dữ liệu Nghiên cứu (CSV)"* tại `/admin/analytics`. | Xuất tệp CSV đã băm mã người học (`SHA-256`), không chứa tên/email thật, có đủ điểm 4 hình thức, điểm kỹ năng, thời gian thi, chỉ số $P, D$ và điểm Pre/Post-test. |
