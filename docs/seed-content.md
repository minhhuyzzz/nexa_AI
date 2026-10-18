# DỮ LIỆU HẠT GIỐNG CHUẨN HÓA (MASTER SEED DATA CONTENT)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

Tài liệu này cung cấp bộ dữ liệu thực tế ban đầu để nạp vào tệp `supabase/seed.sql`, giúp hệ thống ngay sau khi khởi chạy đã có sẵn: **Khung năng lực số chuẩn**, **Gói dịch vụ B2C/B2B**, **Hệ thống Rank/Huy hiệu**, **Kho học liệu chuẩn**, và **Bộ đề đánh giá mẫu đủ 4 hình thức câu hỏi**.

---

## 1. DỮ LIỆU KHUNG NĂNG LỰC SỐ CHUẨN MẶC ĐỊNH (5 MIỀN & 21 KỸ NĂNG)

- **Bản ghi `assessment_frameworks` mặc định:**
  - `code`: `'NEXA_CORE_FRAMEWORK_V1'`
  - `title`: `'Khung Năng lực Số Chuẩn Toàn diện'`
  - `version`: `'1.0'`
  - `status`: `'ACTIVE'`

### Bảng 5 Miền Năng lực (`competency_domains`) & 21 Kỹ năng Thành phần (`competencies`)

| Miền (`domain_index`) | Mã kỹ năng (`skill_code`) | Tên Kỹ năng Thành phần (`title`) | Trọng tâm Đo lường & Chỉ báo Hành vi (`behavioral_indicators` cho AI) |
| :-: | :-: | :--- | :--- |
| **Miền 01: Thông tin và Dữ liệu số** *(20%)* | `1.1` | Tìm kiếm, duyệt và lọc dữ liệu số | Xác định nhu cầu thông tin, sử dụng truy vấn tìm kiếm nâng cao, lọc kết quả chính xác. |
| | `1.2` | Đánh giá độ tin cậy của dữ liệu và thông tin số | Kiểm chứng nguồn tin, phân biệt tin giả/tin do AI tạo sai lệch (hallucination), đối chiếu đa nguồn. |
| | `1.3` | Quản lý, lưu trữ và truy xuất dữ liệu số | Tổ chức cây thư mục khoa học, sao lưu đám mây ( quy tắc 3-2-1), chuẩn hóa tên tệp và cấu trúc dữ liệu. |
| **Miền 02: Giao tiếp và Cộng tác số** *(20%)* | `2.1` | Tương tác qua các công nghệ số | Lựa chọn kênh giao tiếp số phù hợp với ngữ cảnh công việc (Email, Chat, Video Conference). |
| | `2.2` | Chia sẻ thông tin và nội dung số an toàn | Phân quyền chia sẻ tài liệu đám mây đúng vai trò (Viewer/Commenter/Editor), trích dẫn nguồn rõ ràng. |
| | `2.3` | Tham gia dịch vụ công và trách nhiệm công dân số | Sử dụng dịch vụ số trực tuyến, định danh điện tử và tuân thủ quy định pháp luật trên không gian mạng. |
| | `2.4` | Hợp tác và làm việc nhóm trên nền tảng số | Sử dụng công cụ quản lý dự án, đồng biên tập tài liệu thời gian thực và kiểm soát lịch sử phiên bản. |
| | `2.5` | Chuẩn mực ứng xử và giao tiếp số (Netiquette) | Viết thông điệp chuyên nghiệp, tôn trọng sự khác biệt, xử lý xung đột văn minh trên môi trường số. |
| | `2.6` | Quản lý danh tính và dấu vết số cá nhân | Kiểm soát thông tin công khai, bảo vệ uy tín nghề nghiệp và quản lý dấu vết dữ liệu (Digital Footprint). |
| **Miền 03: Sáng tạo Nội dung số & AI** *(20%)* | `3.1` | Phát triển nội dung số đa định dạng | Tạo văn bản, bảng biểu, bài trình chiếu, sơ đồ trực quan và nội dung đa phương tiện chuẩn mực. |
| | `3.2` | Tích hợp, biên tập và cộng tác cùng AI tạo sinh | Thiết kế câu lệnh (Prompt Engineering) hiệu quả, tinh chỉnh và kiểm chứng đầu ra do AI sinh ra. |
| | `3.3` | Bản quyền, giấy phép số và đạo đức sử dụng AI | Phân biệt các giấy phép Creative Commons, nguồn mở, tôn trọng sở hữu trí tuệ và minh bạch khi dùng AI. |
| | `3.4` | Tư duy thuật toán và tự động hóa quy trình | Phân rã bài toán thành các bước logic, thiết lập quy tắc tự động hóa công việc lặp lại hoặc viết script/hàm. |
| **Miền 04: An toàn và Sức khỏe số** *(20%)* | `4.1` | Bảo vệ thiết bị và hạ tầng kết nối | Thiết lập mật khẩu mạnh, xác thực đa yếu tố (2FA/MFA), cập nhật bản vá bảo mật và phòng chống mã độc. |
| | `4.2` | Bảo vệ dữ liệu cá nhân và quyền riêng tư | Nhận diện tấn công lừa đảo (Phishing/Social Engineering), mã hóa dữ liệu nhạy cảm và tuân thủ Nghị định 13. |
| | `4.3` | Bảo vệ sức khỏe thể chất và tâm lý số | Cân bằng thời gian sử dụng màn hình, công thái học làm việc và phòng tránh quá tải thông tin. |
| | `4.4` | Sử dụng công nghệ số bền vững với môi trường | Tối ưu hóa lưu trữ đám mây, giảm rác thải dữ liệu và tiết kiệm năng lượng thiết bị số. |
| **Miền 05: Giải quyết Vấn đề số** *(20%)* | `5.1` | Xác định và khắc phục sự cố kỹ thuật | Chẩn đoán nguyên nhân lỗi phần mềm, kết nối mạng hoặc thiết bị và tìm giải pháp xử lý hiệu quả. |
| | `5.2` | Xác định nhu cầu và lựa chọn công cụ công nghệ | Đánh giá ưu/nhược điểm và chọn đúng phần mềm, công cụ số hoặc mô hình AI phù hợp cho bài toán thực tế. |
| | `5.3` | Ứng dụng sáng tạo công nghệ số vào giải quyết vấn đề | Kết hợp dữ liệu và các công cụ số để tối ưu hóa quy trình học tập, nghiên cứu hoặc vận hành công việc. |
| | `5.4` | Tự nhận diện khoảng trống năng lực số và học tập liên tục | Biết tự đánh giá điểm yếu kỹ năng số của bản thân và chủ động cập nhật công nghệ mới. |

---

## 2. BỘ ĐỀ ĐÁNH GIÁ MẪU ĐỦ 4 HÌNH THỨC (ĐỂ KIỂM THỬ NGAY TRÊN HỆ THỐNG)

- **Tên bộ đề (`assessments`):** *"Đánh giá Toàn diện Năng lực Số Thực chiến (Chuẩn 4 Hình thức)"*
- **Chế độ:** `B2C_SELF_PACED` (`is_public = true`, `duration_minutes = 30`, `passing_score = 70.0`)

### Câu hỏi mẫu 1 — Hình thức Trắc nghiệm (`type = 'MCQ'`, Kỹ năng `1.2`)

```json
{
  "format": "SINGLE_CHOICE",
  "prompt": "Khi sử dụng mô hình ngôn ngữ lớn (AI) để tổng hợp số liệu báo cáo thị trường và nhận được một trích dẫn thống kê rất chi tiết, bước xử lý nào sau đây thể hiện đúng năng lực đánh giá độ tin cậy của thông tin?",
  "options": [
    { "id": "A", "text": "Sử dụng ngay số liệu đó vì AI đã trích dẫn tên cơ quan phát hành rõ ràng." },
    { "id": "B", "text": "Yêu cầu AI viết lại đoạn văn đó bằng giọng văn học thuật hơn trước khi đưa vào báo cáo." },
    { "id": "C", "text": "Truy cập trực tiếp vào cổng dữ liệu gốc của cơ quan được nêu tên để đối chiếu xem báo cáo và con số đó có thực sự tồn tại hay không." },
    { "id": "D", "text": "Hỏi lại chính mô hình AI đó câu hỏi 'Bạn có chắc chắn số liệu này đúng 100% không?'." }
  ],
  "correctOptionIds": ["C"],
  "explanation": "Các mô hình AI tạo sinh có thể gặp hiện tượng ảo giác (Hallucination) — tự tạo ra số liệu và tên nguồn trích dẫn nghe rất hợp lý nhưng không có thật. Việc kiểm chứng chéo tại nguồn dữ liệu gốc là bắt buộc."
}
```

### Câu hỏi mẫu 2 — Hình thức Tình huống (`type = 'SCENARIO'`, Kỹ năng `4.2`)

```json
{
  "scenarioContext": "Vào lúc 16:45 chiều thứ Sáu, bạn nhận được một email có tiêu đề '[KHẨN CẤP] Xác minh tài khoản nhân sự trước 17:00 để không bị khóa quyền truy cập hệ thống'. Địa chỉ người gửi hiển thị là 'Ban Nhân Sự <hr-support@congty-vn.co>'. Trong email có một đường link dẫn tới trang đăng nhập có giao diện giống hệt cổng nội bộ của công ty và yêu cầu bạn nhập Email, Mật khẩu cùng mã OTP vừa gửi về điện thoại.",
  "responseMode": "OPEN_SOLUTION",
  "questionPrompt": "Hãy phân tích các dấu hiệu rủi ro trong tình huống trên và trình bày quy trình 3 bước bạn sẽ thực hiện để xử lý an toàn mà không làm gián đoạn công việc."
}
```

- **Ma trận Rubric 100% (`rubric_matrix`) của Câu hỏi mẫu 2:**
  1. `CRIT_01` (*Trọng số 40%*): Nhận diện đúng dấu hiệu tấn công lừa đảo (Phishing) qua tâm lý thúc ép thời gian, tên miền lạ (`.co` giả mạo) và yêu cầu cung cấp OTP.
  2. `CRIT_02` (*Trọng số 60%*): Đề xuất đúng quy trình xử lý: (1) Tuyệt đối không bấm link và không nhập mật khẩu/OTP; (2) Liên hệ xác minh qua kênh nội bộ độc lập với bộ phận IT/HR; (3) Báo cáo email lừa đảo để cảnh báo toàn đơn vị.

### Câu hỏi mẫu 3 — Hình thức Nhiệm vụ Thực hành (`type = 'PRACTICAL_TASK'`, Kỹ năng `3.2`)

```json
{
  "taskTitle": "Thiết kế câu lệnh (Prompt) chuẩn hóa để phân tích dữ liệu khảo sát",
  "taskInstructions": "Giả sử bạn có một bảng dữ liệu gồm 200 ý kiến phản hồi của khách hàng về lỗi ứng dụng. Hãy viết một câu lệnh (Prompt) hoàn chỉnh để giao việc cho trợ lý AI thực hiện: phân nhóm nguyên nhân lỗi, xếp hạng mức độ nghiêm trọng và xuất kết quả dưới dạng bảng Markdown có 4 cột rõ ràng.",
  "inputDatasetOrContext": "Yêu cầu câu lệnh phải có đủ: Vai trò của AI (Role), Bối cảnh & Nhiệm vụ (Context & Task), Ràng buộc không suy diễn ngoài dữ liệu (Constraints), và Định dạng đầu ra (Output Format).",
  "expectedOutputFormat": "Văn bản câu lệnh Prompt hoàn chỉnh do bạn thiết kế."
}
```

- **Ma trận Rubric 100% (`rubric_matrix`) của Câu hỏi mẫu 3:**
  1. `CRIT_01` (*Trọng số 30%*): Xác lập rõ vai trò chuyên môn và bối cảnh nhiệm vụ cần xử lý.
  2. `CRIT_02` (*Trọng số 40%*): Đặt ràng buộc chặt chẽ (yêu cầu AI chỉ phân tích dựa trên dữ liệu đầu vào, phân loại tiêu chí rõ ràng).
  3. `CRIT_03` (*Trọng số 30%*): Quy định cụ thể cấu trúc bảng Markdown 4 cột ở đầu ra.

### Câu hỏi mẫu 4 — Hình thức Sản phẩm và Minh chứng số (`type = 'DIGITAL_EVIDENCE'`, Kỹ năng `2.2` & `1.3`)

```json
{
  "artifactRequirement": "Hãy tải lên một tệp tài liệu (PDF hoặc Ảnh chụp màn hình quy trình/sơ đồ phân quyền lưu trữ dữ liệu dự án của bạn) hoặc đường dẫn liên kết tới không gian làm việc số đã được tổ chức khoa học.",
  "allowedFileTypes": ["pdf", "png", "jpg", "zip", "url"],
  "maxFileSizeMb": 25,
  "rationalePrompts": [
    "1. Bạn đã tổ chức cấu trúc thư mục và quy ước đặt tên tệp trong minh chứng này theo nguyên tắc nào?",
    "2. Bạn thiết lập quyền truy cập (Xem / Nhận xét / Chỉnh sửa) và phương án sao lưu ra sao để tránh mất mát hoặc lộ lọt dữ liệu?"
  ]
}
```

- **Ma trận Rubric 100% (`rubric_matrix`) của Câu hỏi mẫu 4:**
  1. `CRIT_01` (*Trọng số 50%*): Tính xác thực và khoa học của tệp sản phẩm/minh chứng đính kèm (cấu trúc rõ ràng, đặt tên chuẩn).
  2. `CRIT_02` (*Trọng số 50%*): Lập luận giải trình phương án thuyết phục (tối thiểu 30 từ), giải thích hợp lý cơ chế phân quyền và sao lưu an toàn.

---

## 3. BẢNG CẤP BẬC XẾP HẠNG (RANK TIERS) & GÓI DỊCH VỤ MẶC ĐỊNH

### 3.1. Năm Bậc Rank trên Bảng xếp hạng Top 100+ (`profiles.rank_tier`)

| Mã Bậc (`rank_tier`) | Tên hiển thị tiếng Việt | Ngưỡng Điểm Tích Lũy (`points`) | Điều kiện Điểm năng lực TB |
| :--- | :--- | :---: | :---: |
| `NOVICE` | **Tân binh số** | `0 - 199 điểm (point)` | Mọi mức điểm |
| `EXPLORER` | **Khám phá số** | `200 - 599 điểm (point)` | $\ge 40.0$ |
| `PRACTITIONER` | **Thành thạo số** | `600 - 1,499 điểm (point)` | $\ge 60.0$ |
| `SPECIALIST` | **Chuyên gia số** | `1,500 - 3,499 điểm (point)` | $\ge 75.0$ |
| `ELITE` | **Tinh anh số** | `>= 3,500 điểm (point)` | $\ge 85.0$ |

### 3.2. Năm Gói Dịch vụ Thương mại (`subscription_plans`)

| Mã gói (`code`) | Tên gói dịch vụ | Đối tượng (`target_role`) | Giá niêm yết (`price_vnd`) | Hạn mức cấp phát |
| :--- | :--- | :---: | :---: | :--- |
| `LEARNER_FREE` | Cá nhân Khởi đầu (Free) | `LEARNER` | `0 VNĐ` | 3 lượt đánh giá cơ bản / tháng. |
| `LEARNER_PRO` | Cá nhân Chuyên sâu (Pro) | `LEARNER` | `199,000 VNĐ / năm` | 30 lượt đánh giá đủ 4 hình thức, mở khóa trọn bộ 5 ứng dụng AI & Cấp chứng chỉ số QR. |
| `EVALUATOR_FREE` | Chuyên gia Trải nghiệm | `EVALUATOR` | `0 VNĐ` | Quản lý 1 nhóm (tối đa 15 học viên), 20 lượt chấm AI / tháng. |
| `EVALUATOR_PRO` | Chuyên gia Khảo thí (Pro) | `EVALUATOR` | `499,000 VNĐ / tháng` | Quản lý 20 nhóm (500 học viên), mở phòng thi trực tiếp không giới hạn, 500 lượt chấm AI / tháng, xuất dữ liệu Excel/CSV. |
| `ENTERPRISE` | Tổ chức & Doanh nghiệp | `ORGANIZATION` | `4,990,000 VNĐ / năm` | Đa tài khoản Evaluator, 5,000 lượt đánh giá, Bản đồ nhiệt kỹ năng toàn đơn vị & Mẫu chứng chỉ riêng. |
