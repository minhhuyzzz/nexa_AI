# Danh Sách Nhiệm Vụ Thực Thi: Chuẩn Hóa & Hoàn Thiện Hệ Thống NEXA AI

> Kế hoạch hành động chi tiết tuân thủ quy tắc `planning-and-task-breakdown`.
> Căn cứ: `NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md` và `NEXA_REVIEW_LATEST_FOR_AGENT.md`.

---

## Giai Đoạn 1: P0 — Khóa Chết Thanh Toán & Bảo Mật RPC Database

- [x] **Task 1.1: Migration 21 — Siết chặt RPC `fulfill_payment_transaction`**
  - **Mô tả:** Thu hồi quyền thực thi từ `PUBLIC, anon, authenticated` trên `fulfill_payment_transaction`, chỉ cấp cho `service_role`. Loại bỏ logic kiểm tra `CURRENT_USER = 'postgres'` vì hàm chạy dưới dạng `SECURITY DEFINER` (luôn trả về postgres). Thay thế bằng kiểm tra role caller thực tế hoặc giới hạn quyền thực thi tuyệt đối ở cấp PostgreSQL grant.
  - **Tiêu chuẩn nghiệm thu:**
    1. SQL Migration file mới `src/database/migrations/21_harden_payment_rpc.sql`.
    2. `REVOKE ALL ON FUNCTION fulfill_payment_transaction FROM PUBLIC, anon, authenticated;` được thực thi.
    3. `GRANT EXECUTE ON FUNCTION fulfill_payment_transaction TO service_role;`.
    4. Không còn đoạn check `CURRENT_USER` bị bypass.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/security-regression.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/database/migrations/21_harden_payment_rpc.sql`, `src/features/billing/services/security-regression.test.ts`
  - **Size:** S (< 50 dòng)

- [x] **Task 1.2: Chuẩn hóa Webhook Thanh toán & Chặn Client Mock trên Production**
  - **Mô tả:** Trong `payment-verifier.service.ts` và route `POST /api/webhooks/payment/route.ts`: Cưỡng chế Zod schema bắt buộc `incomingAmount`, `currency`, `provider_tx_id`, `reference_code`, `status = PAID`. Nếu thiếu trường tiền hoặc không khớp đơn hàng thì fail-closed (HTTP 400/422). Vô hiệu hóa tính năng mock client-side thanh toán nếu `NODE_ENV === 'production'`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Zod schema từ chối webhook payload thiếu `amount` hoặc `currency`.
    2. Endpoint webhook trả về lỗi rõ ràng khi số tiền không khớp với `billing_transactions.amount`.
    3. Mock simulation trả về 403 Forbidden nếu môi trường là production.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/payment-verifier.service.test.ts`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/features/billing/services/payment-verifier.service.ts`, `src/app/api/webhooks/payment/route.ts`, `src/app/api/billing/mock-pay/route.ts`
  - **Size:** M (~100 dòng)

- [x] **Checkpoint 1: Kiểm thử P0 an toàn thanh toán**
  - **Tiêu chuẩn nghiệm thu:** Toàn bộ test suites liên quan đến billing và security đều xanh (`100% pass`).

---

## Giai Đoạn 2: P1 — Khép Kín Vòng Đời Lớp Học → Giao Bài → Nộp Bài → Bàn Chấm

- [x] **Task 2.1: Tách Domain Nhóm Học Tập (`evaluator_classes`) khỏi Phòng Thi Live (`exam_rooms`)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/groups/page.tsx`, sửa câu truy vấn lấy danh sách lớp học: query từ `evaluator_classes` thay vì `exam_rooms`. Sửa logic "Tham gia nhóm bằng mã PIN": gọi API tham gia lớp học (`/api/classes/join` với `class_code`) thay vì gọi API phòng thi (`/api/rooms/join` với mã PIN 6 số).
  - **Tiêu chuẩn nghiệm thu:**
    1. Danh sách tại `/personal/groups` hiển thị đúng các lớp học của người dùng từ `evaluator_classes` và `class_members`.
    2. Nhấp vào nhóm mở đúng trang `/personal/groups/[groupId]` mà không báo lỗi "Không tìm thấy lớp học".
    3. Dialog tham gia nhóm yêu cầu `Mã lớp học` và xác thực với bảng `evaluator_classes`.
  - **Lệnh kiểm chứng:** Kiểm tra route `/personal/groups` và API endpoint `/api/classes/join`.
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/(dashboard)/personal/groups/page.tsx`, `src/app/(dashboard)/personal/groups/[groupId]/page.tsx`, `src/app/api/classes/join/route.ts`
  - **Size:** M (~150 dòng)

- [x] **Task 2.2: Nộp Bài Thật: Persistence `assignment_submissions` & Quản Lý File Minh Chứng**
  - **Mô tả:** Thay thế hoàn toàn logic `setTimeout` giả lập trong `src/app/(dashboard)/personal/submissions/page.tsx`. Xây dựng API và giao diện nộp bài thực tế: sinh viên tải file minh chứng lên bucket `nexa-evidence`, ghi nhận bản ghi vào bảng `assignment_submissions` với trạng thái `SUBMITTED`, lưu đường dẫn storage path và thời gian nộp.
  - **Tiêu chuẩn nghiệm thu:**
    1. Nút "Nộp bài" thực hiện POST dữ liệu thật lên backend.
    2. Dữ liệu được lưu vào `assignment_submissions`.
    3. Tải lại trang (F5) trạng thái bài nộp vẫn tồn tại (không mất dữ liệu).
    4. Giảng viên mở `/personal/grading` thấy bài nộp mới xuất hiện trong danh sách cần chấm.
  - **Lệnh kiểm chứng:** Thực hiện nộp bài qua UI và truy vấn Supabase kiểm tra bản ghi `assignment_submissions`.
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/app/(dashboard)/personal/submissions/page.tsx`, `src/app/api/assessments/[id]/submit/route.ts`
  - **Size:** M (~200 dòng)

- [x] **Task 2.3: Bảo Mật File Minh Chứng: On-Demand Signed URLs & Quyền Theo Tài Nguyên**
  - **Mô tả:** Xóa bỏ cơ chế fallback sang `getPublicUrl` đối với bucket private `nexa-evidence`. Xây dựng endpoint lấy Signed URL tạm thời (TTL 60 - 300 giây) có kiểm tra quyền: Chỉ chủ sở hữu bài nộp (người học) hoặc người chấm/giảng viên của lớp học chứa bài tập đó mới được phép lấy link xem file.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không còn lời gọi `supabase.storage.from('nexa-evidence').getPublicUrl()`.
    2. Người dùng lạ không thể truy cập hoặc lấy link tải file minh chứng của người khác.
    3. Giảng viên của lớp và người nộp bài tải được file minh chứng an toàn qua Signed URL.
  - **Lệnh kiểm chứng:** Gọi API lấy Signed URL bằng tài khoản không có quyền và xác nhận trả về 403 Forbidden.
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/api/evidence/signed-url/route.ts`, `src/app/api/evidence/upload/route.ts`, `src/app/(dashboard)/personal/grading/page.tsx`
  - **Size:** S (~80 dòng)

- [x] **Task 2.4: Kiểm Tra Quyền Theo Tài Nguyên Khi Chấm Bài Thủ Công & AI Grading**
  - **Mô tả:** Trong `src/app/api/ai/grade-submission/route.ts` và API chấm bài thủ công: Thêm kiểm tra quyền truy cập tài nguyên. Nếu người gọi là Giảng viên/Người chấm, phải xác thực họ là người tạo bài tập (`created_by`) hoặc là giáo viên của lớp học chứa bài tập đó; không chỉ kiểm tra vai trò chung chung `profile.role === 'EVALUATOR'`.
  - **Tiêu chuẩn nghiệm thu:**
    1. API từ chối chấm bài nếu người chấm không phụ trách lớp học tương ứng.
    2. Chấm bài bằng AI và chấm bài thủ công cập nhật đúng điểm và nhận xét vào `assignment_submissions` / `assessment_submissions`.
  - **Lệnh kiểm chứng:** Unit test API chấm bài với 2 tài khoản giảng viên khác nhau.
  - **Phụ thuộc:** Task 2.3
  - **Files:** `src/app/api/ai/grade-submission/route.ts`, `src/app/api/evaluator/grade/route.ts`
  - **Size:** S (~60 dòng)

- [x] **Checkpoint 2: Kiểm thử toàn trình Vòng Đời Lớp Học & Bài Tập**
  - **Tiêu chuẩn nghiệm thu:** Luồng: Tạo lớp -> Tạo bài tập -> Sinh viên nộp bài đính kèm minh chứng -> Giảng viên xem bài và chấm điểm -> Sinh viên xem kết quả hoạt động 100% dữ liệu thật.

---

## Giai Đoạn 3: P1 — Chuẩn Hóa Không Gian Tổ Chức & Lời Mời Thành Viên

- [x] **Task 3.1: Migration 22 — Đồng bộ Constraint `organization_invitations.org_role`**
  - **Mô tả:** Cập nhật check constraint của cột `org_role` trong bảng `organization_invitations` để chấp nhận đầy đủ các role nghiệp vụ thực tế: `ORG_OWNER`, `ORG_ADMIN`, `ASSESSOR`, `REPORT_VIEWER`, `MEMBER`.
  - **Tiêu chuẩn nghiệm thu:**
    1. File migration mới `src/database/migrations/22_update_org_roles_constraint.sql`.
    2. Lời mời với vai trò `ASSESSOR` hoặc `REPORT_VIEWER` từ `/org/[slug]/members` lưu thành công vào CSDL mà không văng lỗi PostgreSQL check constraint violation.
  - **Lệnh kiểm chứng:** Chạy lệnh mời thành viên vai trò `ASSESSOR` qua API và xác nhận mã HTTP 201 Created.
  - **Phụ thuộc:** Không có
  - **Files:** `src/database/migrations/22_update_org_roles_constraint.sql`, `src/app/api/organizations/invite/route.ts`
  - **Size:** S (< 40 dòng)

- [x] **Task 3.2: Giữ Ngữ Cảnh Tổ Chức Khi Tạo Đề và Quản Lý Lớp Học**
  - **Mô tả:** Khi người dùng đang ở trong không gian tổ chức `/org/[slug]/*`, các nút tạo đề hoặc tạo lớp học không được chuyển hướng sang `/personal/assessments/new` mà phải giữ nguyên ngữ cảnh tổ chức: điều hướng đến `/org/[slug]/assessments/new` hoặc mở Modal tạo bài thi nội bộ gắn `organization_id` tương ứng.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tạo đề trong Tổ chức tự động gán `organization_id = currentOrg.id`.
    2. Bài thi tạo trong Tổ chức hiển thị tại danh mục đề thi của tổ chức và tuân thủ quota của tổ chức, không tính vào quota cá nhân.
  - **Lệnh kiểm chứng:** Tạo một bài thi từ `/org/[slug]/assessments` và kiểm tra `organization_id` trong bảng `assessments`.
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/app/(dashboard)/org/[slug]/assessments/page.tsx`, `src/app/(dashboard)/org/[slug]/classes/page.tsx`, `src/app/(dashboard)/org/[slug]/assessments/new/page.tsx`, `src/components/dashboard/org/CreateOrgClassButton.tsx`, `src/app/api/classes/route.ts`, `src/features/assessments/components/AssessmentStudio.tsx`
  - **Size:** M (~150 dòng)

- [x] **Checkpoint 3: Kiểm thử Đa Người Thuê Tổ Chức**
  - **Tiêu chuẩn nghiệm thu:** Mời thành viên với mọi vai trò thành công; tài nguyên tổ chức hoàn toàn cô lập với tài nguyên cá nhân.

---

## Giai Đoạn 4: P2 — Dọn Dẹp Route, UX & Hoàn Thiện Vận Hành

- [x] **Task 4.1: Chuẩn Hóa Trang Kết Quả Khảo Thí (Result Page Deduplication)**
  - **Mô tả:** Gộp trang kết quả khảo thí thành một nguồn sự thật duy nhất tại `/personal/assessments/[id]/result?submissionId=...`. Chuyển hướng hoặc tái sử dụng component từ `/personal/results/[id]` để tránh trùng lặp 2 màn hình hiển thị cùng dữ liệu.
  - **Tiêu chuẩn nghiệm thu:**
    1. Cả 2 đường dẫn đều trỏ về một giao diện thống nhất, nhận `submissionId`.
    2. Hiển thị điểm số, phân tích 5 miền năng lực DigComp, và các nút kích hoạt AI on-demand.
  - **Lệnh kiểm chứng:** Kiểm tra route `/personal/assessments/[id]/result` và `/personal/results/[id]`.
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/(dashboard)/personal/assessments/[id]/result/page.tsx`
  - **Size:** S (~80 dòng)

- [x] **Task 4.2: Phân Tách Rõ Ràng Phân Tích Năng Lực (Analysis) & Lộ Trình Học Tập (Learning Path)**
  - **Mô tả:** Tách biệt rõ 2 chức năng: `/personal/competency` chuyên hiển thị phân tích năng lực và khoảng trống kỹ năng (< 60%); `/personal/learning-path` chuyên hiển thị các bước học tập và khóa học đề xuất dựa trên kết quả phân tích.
  - **Tiêu chuẩn nghiệm thu:**
    1. Giao diện `/personal/competency` tập trung vào radar chart, bảng chi tiết từng năng lực.
    2. Giao diện `/personal/learning-path` tập trung vào roadmap từng giai đoạn và nút "Tạo lộ trình bằng AI".
  - **Lệnh kiểm chứng:** Truy cập cả 2 trang và kiểm tra tính trực quan, độc lập.
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/(dashboard)/personal/competency/page.tsx`, `src/app/(dashboard)/personal/learning-path/page.tsx`
  - **Size:** S (~80 dòng)

- [x] **Task 4.3: Persistence Dữ Liệu Cài Đặt Người Dùng (`personal/settings`) Vào Database Thật**
  - **Mô tả:** Kết nối trang `/personal/settings` với API `/api/users/profile` và Supabase Auth. Cho phép người dùng cập nhật thông tin hiển thị (tên, avatar, thông báo, ngôn ngữ) lưu trực tiếp vào bảng `user_profiles`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Đổi tên hiển thị tại settings và bấm lưu -> reload trang tên mới vẫn được giữ nguyên.
    2. Đổi mật khẩu hoạt động thông qua `supabase.auth.updateUser()`.
  - **Lệnh kiểm chứng:** Test cập nhật thông tin profile qua UI settings và F5 kiểm tra.
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/(dashboard)/personal/settings/page.tsx`
  - **Size:** S (~100 dòng)

- [x] **Task 4.4: Cấu Hình Fail-Closed Cho Supabase Admin Client**
  - **Mô tả:** Trong `src/lib/supabase/admin.ts`, đảm bảo rằng nếu biến môi trường `SUPABASE_SERVICE_ROLE_KEY` bị thiếu trên production, hệ thống phải ném lỗi (throw Error) ngay lập tức chứ không được âm thầm fallback sang `anon` key hoặc tạo client không đủ quyền gây ra lỗi ngầm.
  - **Tiêu chuẩn nghiệm thu:**
    1. Hàm `createAdminClient()` throw Error nếu thiếu secret key trên môi trường production.
    2. Ghi log cảnh báo rõ ràng trên môi trường test/dev.
  - **Lệnh kiểm chứng:** Unit test `admin.ts` với mock biến môi trường rỗng.
  - **Phụ thuộc:** Không có
  - **Files:** `src/lib/supabase/admin.ts`
  - **Size:** S (< 30 dòng)

- [x] **Checkpoint 4: Kiểm thử tổng thể & Đóng gói chất lượng**
  - **Tiêu chuẩn nghiệm thu:**
    1. `npm run typecheck` đạt 0 lỗi.
    2. `npm test` vượt qua 100% bài kiểm thử.
    3. `npm run build` thành công không có warning nghiêm trọng.
