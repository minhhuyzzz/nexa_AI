# NHẬT KÝ THAY ĐỔI DỰ ÁN (PROJECT CHANGELOG)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-CHANGELOG`
- **Quy chuẩn đánh số phiên bản:** Semantic Versioning (SemVer 2.0.0)

---

## [v3.2.0-spec] — 2026-10-14 (BẢN CHUẨN HÓA TOÀN DIỆN SẴN SÀNG LẬP TRÌNH)

### 1. Mô hình Kinh doanh & Định vị Vai trò (`00-project-context.md`, `prd.md`, `use-cases.md`)

- **Mở rộng hoàn chỉnh Mô hình B2C + B2B2C + B2B:** Hỗ trợ người học cá nhân tự đánh giá trên nền tảng và nhận kết quả AI tức thì (B2C), bên cạnh mô hình cho thuê không gian khảo thí cho Người đánh giá độc lập và Tổ chức (B2B).
- **Xác lập rõ vai trò Chủ nền tảng (`Super Admin`):** Admin chính là chủ sở hữu hệ thống quản trị Khung năng lực số động, Ngân hàng đề chuẩn, Kho học liệu chuẩn, Cấu hình AI đa mô hình, Gói dịch vụ, Đối soát VietQR và Xuất bộ dữ liệu nghiên cứu.
- **Cố định Vai trò Tĩnh (`1 Email = 1 Static Role`):** Khách vãng lai tự đăng ký vai trò `LEARNER` hoặc `EVALUATOR` tại `/register` (vào thẳng gói Free để trải nghiệm ngay) và vai trò được khóa cứng vĩnh viễn bằng Trigger CSDL (`trg_lock_static_role`).

### 2. Khung Năng lực Động, 4 Hình thức Đánh giá & 5 Ứng dụng AI (`database.md`, `ai-rules.md`, `agent-workflow.md`, `prompts.md`)

- **Khung Năng lực Số Động (Dynamic Framework Engine):** Loại bỏ việc gắn cứng tên phiên bản cố định trên giao diện; cho phép Admin tùy biến, cập nhật miền năng lực, kỹ năng và tạo phiên bản khung mới ngay trong CSDL.
- **Đặc tả sâu 4 Hình thức Đánh giá kèm JSONB Schema:** (1) Câu hỏi trắc nghiệm (`MCQ`), (2) Câu hỏi tình huống (`SCENARIO`), (3) Nhiệm vụ thực hành (`PRACTICAL_TASK`), (4) Sản phẩm và minh chứng số (`DIGITAL_EVIDENCE` bắt buộc kèm giải trình $\ge 30$ từ).
- **Kiến trúc AI Đa mô hình & Huấn luyện 3 Tầng:** Bổ sung `AIProviderAdapter` hỗ trợ đổi linh hoạt giữa Google Gemini, OpenAI và Claude; thiết lập cơ chế huấn luyện 3 tầng (Khung năng lực + Rubric 100% + Bài mẫu chuẩn `is_gold_sample`).
- **Tối ưu hóa Pipeline 2 Lần Gọi API cho 5 Ứng dụng AI:** Giải quyết trọn vẹn (1) Hỗ trợ chấm điểm, (2) Phân tích điểm mạnh/yếu, (3) Nhận diện khoảng trống năng lực, (4) Phản hồi cá nhân hóa, và (5) Đề xuất lộ trình phát triển năng lực 4 bước.

### 3. Nhóm, Phòng thi Trực tiếp, Bảng xếp hạng Top 100+ & Xuất Dữ liệu Nghiên cứu (`ux-flow.md`, `ui-spec.md`, `api.md`)

- **Đa phương thức tham gia Nhóm & Phòng thi:** Hỗ trợ tham gia nhóm qua Link `?join=CODE`, Mã nhóm và QR Code; hỗ trợ mở Phòng thi trực tiếp ở cả **Chế độ Mở (`OPEN` — không cần thuộc nhóm)** và **Chế độ Nhóm (`GROUP_ONLY`)** qua Link `?pin=849201`, Mã PIN 6 số và QR Code.
- **Bổ sung Nhận xét trực tiếp của Người đánh giá (`public.group_feedbacks`):** Cho phép Người đánh giá gửi lời nhận xét định kỳ và lời phê bài thi trực tiếp tới Dashboard của Người học.
- **Bổ sung Điểm tích lũy (`points`) & Bảng xếp hạng Rank Top 100+ (`/learner/leaderboard`):** Tạo động lực giữ chân người học tự do B2C với bộ đệm tốc độ cao trên Upstash Redis.
- **Bổ sung Xuất dữ liệu phân tích & Bộ dữ liệu nghiên cứu (`Research Dataset Export`):** Cho phép Evaluator xuất bảng điểm nhóm (`.xlsx`/`.csv`/`.pdf`) và cho phép Admin xuất bộ dữ liệu khảo thí ẩn danh phục vụ phân tích trên SPSS, R, Python, Power BI.

### 4. Thiết kế Giao diện Tối giản Khoa học — Khử sạch "Mùi AI" (`design-system.md`, `ui-spec.md`)

- Áp dụng **Quy tắc 90-8-2 Monochrome Slate (`#FFFFFF`, `#F8FAFC`, `#0F172A`, `#E2E8F0`) + 1 Màu nhấn duy nhất (`#0284C7`)**; loại bỏ hoàn toàn màu tím neon, gradient lòe loẹt, 5 màu cầu vồng trên thẻ và emoji rác.
- Loại bỏ công cụ tra cứu chứng chỉ QR khỏi Landing Page và `PublicHeader` (chỉ giữ `/verify/[credentialId]` làm trang Kiosk độc lập khi quét mã QR trên chứng chỉ).

---

## [v3.0.0-spec] — 2026-10-10

- Chuẩn hóa mô hình CSDL 29 bảng vật lý ban đầu và tách biệt 3 bộ Shell Dashboard (`Sidebar`, `Topbar`, `AvatarMenu`).

## [v1.0.0-spec] — 2026-10-08

- Khởi tạo bộ 25 tài liệu đặc tả kỹ thuật và nghiệp vụ đầu tiên của dự án NEXA.
