# Kế Hoạch Triển Khai Hoàn Chỉnh: Chuẩn Hóa Workspaces & Khép Kín Nghiệp Vụ NEXA AI

> **Căn cứ tài liệu:**
> - [NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md](file:///c:/nexa/NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md) (Đặc tả mô hình sản phẩm chuẩn)
> - [NEXA_REVIEW_LATEST_FOR_AGENT.md](file:///c:/nexa/NEXA_REVIEW_LATEST_FOR_AGENT.md) (Báo cáo thẩm định code tại commit `7c8fbde`)
> 
> **Kỹ năng áp dụng:** `planning-and-task-breakdown`  
> **Trạng thái:** Kế hoạch thực thi chính thức (Active Master Plan)

---

## 1. Tổng Quan & Nhận Xét Chuyên Sâu

### 1.1. Nhận Xét Độc Lập Về 2 Tài Liệu Căn Cứ
1. **Tài liệu Đặc Tả Sản Phẩm (`PRODUCT_SPEC`):**
   - Đặt nền móng triết lý đúng đắn: Xóa bỏ sự phân mảnh `LEARNER` vs `EVALUATOR`, chuyển sang **1 Danh tính Cá nhân Thống nhất** với 3 ngữ cảnh (`PERSONAL`, `ORGANIZATION`, `PLATFORM_ADMIN`).
   - Cung cấp công thức bảo mật bất biến: `Quyền = Auth.uid + Workspace + Ownership/Org Role + Resource Permission + Quota + State`.
   - Vạch ra ranh giới dữ liệu không được phép nhầm lẫn:
     - `CLASS` (Lớp học dài hạn) $\ne$ `LIVE ROOM` (Phòng thi mã PIN tạm thời).
     - `ASSIGNMENT` (Bài tập giao theo lớp) $\ne$ `ROOM PARTICIPANT` (Thí sinh vào phòng thi).
     - `PERSONAL RESOURCE` $\ne$ `ORGANIZATION RESOURCE`.
     - `AI Gợi ý Rubric` $\ne$ `Điểm chốt của Giảng viên`.

2. **Tài liệu Báo Cáo Thẩm Định Code (`REVIEW_LATEST`):**
   - Đánh giá thẳng thắn, chi tiết đến từng file và dòng code tại commit `7c8fbde`.
   - Ghi nhận chính xác các điểm commit trước đã sửa (Superadmin authorization, Email invite check, Demo mode disabled on production, Storage 500 error handling, Webhook secret check, 5 regression tests).
   - Chỉ ra chính xác các "khoảng trống nguy hiểm":
     - **P0:** Thanh toán chưa an toàn ở cấp Database SQL (`CURRENT_USER` bypass, `PUBLIC` execute) và Webhook thiếu ép buộc amount/currency.
     - **P1:** Bốn use case cốt lõi đang bị "chắp vá" hoặc làm giả bằng UI state (Nhóm học tập tìm nhầm ID phòng thi, Nộp bài dùng `setTimeout`, Tạo đề trong Org bị nhảy sang Personal, Role lời mời vi phạm Check constraint trong DB).
     - **P2:** UX trùng lặp và các route chưa persistence vào database thật.

### 1.2. Mục Tiêu Đích Đến Của Kế Hoạch
Giải quyết dứt điểm các lỗ hổng P0, khép kín các luồng nghiệp vụ P1 bằng dữ liệu thật trong Supabase, dọn dẹp UX P2, và đưa hệ sinh thái NEXA AI đạt chuẩn sẵn sàng cho môi trường kiểm thử thực tế và sản xuất.

---

## 2. Quyết Định Kiến Trúc Then Chốt (Architecture Decisions)

1. **ADR-01: Bảo mật Thanh toán Hai Lớp (Two-Layer Payment Enforcement):**
   - *Lớp DB:* Hàm RPC `fulfill_payment_transaction` bị thu hồi quyền thực thi từ `PUBLIC, anon, authenticated` và CHỈ cấp cho `service_role`. Loại bỏ mọi điều kiện dựa vào `CURRENT_USER`.
   - *Lớp API:* Webhook thanh toán cưỡng chế schema Zod nghiêm ngặt (`amount`, `currency`, `provider_tx_id`, `reference_code`, `status = PAID`). Thiếu bất kỳ trường nào sẽ fail-closed ngay lập tức. Cấm hoàn toàn mock client-side payment trên production.

2. **ADR-02: Tách Rời Hoàn Toàn Domain Lớp Học (`CLASS`) và Phòng Thi Trực Tiếp (`LIVE ROOM`):**
   - `/personal/groups/*` và `/org/[slug]/classes/*` chỉ tương tác với bảng `evaluator_classes`, `class_members`, `class_assignments`, `assignment_submissions`.
   - `/personal/live-room` và `/personal/live-pin` chỉ tương tác với `exam_rooms`, `room_participants`.
   - Mã tham gia lớp (`class_code`) độc lập với mã PIN 6 số của phòng thi (`room_code`).

3. **ADR-03: Khép Kín Vòng Đời Bài Tập (Real Assignment Lifecycle):**
   - Sinh viên nộp bài qua API `/api/classes/assignments/[id]/submit`.
   - File minh chứng được tải lên bucket private `nexa-evidence`, lưu vào `assignment_submissions`.
   - Giảng viên xem bài nộp thật tại bàn chấm `/personal/grading`. Refresh trình duyệt dữ liệu không bao giờ bị mất.

4. **ADR-04: Giữ Ngữ Cảnh Tổ Chức Khi Thao Tác (Tenant Context Retention):**
   - Khi ở `/org/[slug]/*`, các nút tạo đề/tạo lớp mở modal hoặc route con `/org/[slug]/assessments/new`, `/org/[slug]/classes/new`.
   - Mọi tài nguyên sinh ra phải gắn `organization_id` và xác thực quyền `ORG_ADMIN` hoặc `ASSESSOR` tại backend.

---

## 3. Lộ Trình Triển Khai Chi Tiết (Vertical Slices)

### Giai Đoạn 1: P0 — Khóa Chết Thanh Toán & Bảo Mật RPC Database
- [x] **Task 1.1**: Migration 21 — Siết chặt RPC `fulfill_payment_transaction` và kiểm tra caller context
- [x] **Task 1.2**: Chuẩn hóa Webhook Thanh toán: Validate Schema bắt buộc & Chặn Client Mock trên Production
- [x] **Checkpoint 1: Hoàn tất P0, chạy bộ test thanh toán & bảo mật SQL**

### Giai Đoạn 2: P1 — Khép Kín Vòng Đời Lớp Học → Giao Bài → Nộp Bài → Bàn Chấm
- [x] **Task 2.1**: Tách Domain Nhóm Học Tập (`evaluator_classes`) khỏi Phòng Thi Live (`exam_rooms`)
- [x] **Task 2.2**: Nộp Bài Thật: Persistence `assignment_submissions` & Quản Lý File Minh Chứng
- [x] **Task 2.3**: Bảo Mật File Minh Chứng: On-Demand Signed URLs & Quyền Theo Tài Nguyên
- [x] **Task 2.4**: Kiểm Tra Quyền Theo Tài Nguyên Khi Chấm Bài Thủ Công & AI Grading
- [x] **Checkpoint 2: Hoàn tất P1 Core Loop, kiểm thử luồng học tập end-to-end**

### Giai Đoạn 3: P1 — Chuẩn Hóa Không Gian Tổ Chức & Lời Mời Thành Viên
- [x] **Task 3.1**: Migration 22 — Đồng bộ Constraint `organization_invitations.org_role`
- [x] **Task 3.2**: Giữ Ngữ Cảnh Tổ Chức Khi Tạo Đề và Quản Lý Lớp Học
- [x] **Checkpoint 3: Hoàn tất P1 Organization, kiểm thử mời thành viên & cô lập dữ liệu**

### Giai Đoạn 4: P2 — Dọn Dẹp Route, UX & Hoàn Thiện Vận Hành
- [x] **Task 4.1**: Chuẩn Hóa Trang Kết Quả Khảo Thí (Result Page Deduplication) Theo `submissionId`
- [x] **Task 4.2**: Phân Tách Rõ Ràng Phân Tích Năng Lực (Analysis) & Lộ Trình Học Tập (Learning Path)
- [x] **Task 4.3**: Persistence Dữ Liệu Cài Đặt Người Dùng (`personal/settings`) Vào Database Thật
- [x] **Task 4.4**: Cấu Hình Fail-Closed Cho Supabase Admin Client
- [x] **Checkpoint 4: Toàn bộ kiểm thử hồi quy, Typecheck 0 lỗi, Build thành công**

---

## 4. Quản Trị Rủi Ro (Risks & Mitigations)

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| :--- | :---: | :--- |
| **Gãy tương thích dữ liệu cũ khi tách Class khỏi Room** | Cao | Migration kiểm tra foreign key, giữ nguyên dữ liệu các bảng `evaluator_classes` hiện hữu, không drop bảng cũ. |
| **Tắc nghẽn Webhook thanh toán khi provider đổi định dạng** | Trung bình | Định nghĩa Zod parser linh hoạt cho các trường hợp alias (ví dụ `amount` hoặc `order_amount`), ghi log cảnh báo chi tiết. |
| **Mất quyền truy cập file minh chứng khi chuyển bucket private** | Trung bình | Cung cấp helper sinh Signed URL có TTL 60-300 giây tại thời điểm người dùng có quyền bấm xem file. |
| **Trùng lặp role khi chuyển đổi giữa Personal và Organization** | Thấp | Server đọc `user_organizations` và cookie `nexa_active_workspace`, luôn ưu tiên quyền tại backend thay vì tin cậy frontend. |

---

## 5. Tiêu Chuẩn Nghiệm Thu (Definition of Done)
1. **P0:** Không thể thực thi `fulfill_payment_transaction` từ `PUBLIC`, `anon` hoặc `authenticated`; Webhook thiếu amount bị từ chối; unit test thanh toán pass 100%.
2. **P1:** Danh sách nhóm tải đúng `evaluator_classes`; sinh viên nộp bài lưu DB thật; tải lại trang không mất bài; Giảng viên thấy bài nộp trên Bàn chấm.
3. **P1:** Tạo bài trong Org giữ đúng `organization_id`; lời mời tổ chức chấp nhận đúng mọi role hợp lệ.
4. **P2:** Không còn mock UI `setTimeout`; trang kết quả thống nhất theo `submissionId`.
5. **Chất lượng:** `npm run typecheck` đạt 0 lỗi, `npm test` vượt qua 100% test suites, `npm run build` thành công.
