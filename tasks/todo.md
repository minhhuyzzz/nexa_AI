# Danh Sách Nhiệm Vụ Triển Khai (Todo List): Khắc Phục 3 Dashboard ce74dea

> **Tài liệu nguồn:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Đặc tả kỹ thuật:** [`docs/NEXA_SPEC_REMEDIATION_VNEXT_ce74dea.md`](file:///c:/nexa/docs/NEXA_SPEC_REMEDIATION_VNEXT_ce74dea.md)

---

## Phase 1: Nền tảng Bảo mật, Kiểm soát Phiên & RBAC Admin (auth-security-rbac)

- [x] **Task 1.1: Migration 34 — Cột kiểm soát phiên & Quyền Admin nội bộ**
  - [x] Thêm `tokens_revoked_at TIMESTAMPTZ` vào bảng `profiles`.
  - [x] Thêm `admin_role` với các quyền: `SUPER_ADMIN`, `OPERATIONS_ADMIN`, `CONTENT_ADMIN`, `FINANCE_ADMIN`, `AI_OPERATOR`.
  - [x] Áp dụng migration forward-only và kiểm tra index.

- [x] **Task 1.2: Thu hồi phiên thực sự (Revoke Session Real Implementation) — NEXA-01**
  - [x] Trong `src/app/api/admin/users/route.ts`: Xử lý `REVOKE_SESSION` gọi `supabase.auth.admin.signOut(userId, 'global')`.
  - [x] Cập nhật `tokens_revoked_at = NOW()` vào bảng `profiles`.
  - [x] Cập nhật `src/lib/auth/getEffectiveUser.ts`: Từ chối phiên cũ có thời điểm phát hành trước `tokens_revoked_at`.
  - [x] Kiểm thử `AUTH-REV-01`: Đảm bảo phiên cũ bị 401, không báo success giả.

- [x] **Task 1.3: Cưỡng chế chặn tài khoản bị khóa (is_suspended) — NEXA-02**
  - [x] Trong `src/middleware.ts`: Đọc `profile.is_suspended`. Nếu `true`, chuyển hướng về `/account-suspended`.
  - [x] Trong `src/lib/auth/getEffectiveUser.ts`: Ném lỗi `AccountSuspendedError` (HTTP 403) chặn mọi API nhạy cảm.
  - [x] Tạo trang `/account-suspended/page.tsx` thông báo thân thiện và kênh liên hệ hỗ trợ.
  - [x] Chặn việc Super Admin tự khóa tài khoản của chính mình hoặc tự tước quyền.
  - [x] Kiểm thử `AUTH-SUSP-01`: Đã login trước khi Admin khóa $\rightarrow$ mọi request tiếp theo bị từ chối 403.

- [x] **Task 1.4: Phân quyền Admin nội bộ theo Action (Granular Admin RBAC) — NEXA-03**
  - [x] Xây dựng guard helper `requirePlatformPermission(permission)` trong `src/lib/auth/admin-guard.ts`.
  - [x] Gắn guard vào các API `/api/admin/transactions/*` (yêu cầu `FINANCE_ADMIN` hoặc `SUPER_ADMIN`).
  - [x] Gắn guard vào `/api/admin/ai-gateway` (yêu cầu `AI_OPERATOR` hoặc `SUPER_ADMIN`).
  - [x] Kiểm thử `RBAC-ADMIN-01`: `CONTENT_ADMIN` gọi Finance API bị từ chối 403.

---

## Phase 2: Toàn Vẹn Ngân Hàng Câu Hỏi & Phân Quyền Creator (item-bank-schema)

- [x] **Task 2.1: Migration 34 — Chuẩn hóa bảng question_bank_items**
  - [x] Thêm cột `rubric_definition JSONB`, `owner_user_id UUID REFERENCES auth.users(id)`, `scope VARCHAR(20) DEFAULT 'PERSONAL'`.
  - [x] Ánh xạ enum độ khó 4 bậc DigComp (`FOUNDATION`, `INTERMEDIATE`, `ADVANCED`, `HIGHLY_SPECIALIZED`).
  - [x] Ràng buộc liên kết bảng con `question_bank_options` cho các câu hỏi trắc nghiệm (MCQ).

- [x] **Task 2.2: Chính sách RLS cho Creator Cá Nhân — NEXA-08**
  - [x] Cập nhật policy RLS trên `question_bank_items` cho phép `owner_user_id = auth.uid()` được tạo, sửa, đọc câu hỏi của mình.
  - [x] Chặn người dùng sửa câu hỏi của người khác (trừ `CONTENT_ADMIN` / `SUPER_ADMIN`).
  - [x] Kiểm thử `QB-02`: Creator A không sửa được item của Creator B.

- [x] **Task 2.3: QuestionBankWriteService dùng chung — NEXA-07, NEXA-13, NEXA-17**
  - [x] Tạo `src/features/assessments/services/question-bank-write.service.ts`.
  - [x] Xử lý lưu Transaction nguyên tử: ghi `question_bank_items` và ghi `question_bank_options`.
  - [x] Ràng buộc bắt buộc 1 trong 5 miền năng lực `domain_id IN ('D1','D2','D3','D4','D5')`.
  - [x] Kiểm thử `QB-01`: Personal Free/Pro tạo MCQ lưu thành công cả item và options.

- [x] **Task 2.4: Nâng cấp Editor & Importer câu hỏi**
  - [x] Refactor `src/app/(dashboard)/personal/item-bank/[id]/page.tsx` sử dụng `QuestionBankWriteService`.
  - [x] Refactor `src/features/assessments/components/ItemBankImporter.tsx` sử dụng `QuestionBankWriteService`.
  - [x] Kiểm thử `QB-03`: Nhập 10 câu có 1 câu lỗi $\rightarrow$ báo lỗi dòng sai, 9 câu hợp lệ lưu thành công.

---

## Phase 3: Bảo Mật & Toàn Vẹn Bộ Đề Khảo Thí (assessment-integrity)

- [x] **Task 3.1: Route Detail Bộ Đề — UUID Validation & 404 — NEXA-12**
  - [x] Trong `src/app/(dashboard)/personal/assessments/[id]/page.tsx`: Kiểm tra `params.id` bằng UUID validator.
  - [x] Nếu ID không hợp lệ $\rightarrow$ trả về `notFound()` (HTTP 404 chuẩn).
  - [x] Xóa bỏ hoàn toàn truy vấn `.limit(1)` lấy đề ngẫu nhiên.
  - [x] Kiểm thử `ASM-DETAIL-01`: Truy cập ID rác trả về 404.

- [x] **Task 3.2: Sanitized DTO — Không truyền is_correct cho thí sinh — NEXA-12**
  - [x] Bóc tách trường `is_correct` và `explanation` khi người xem là thí sinh hoặc xem trước.
  - [x] Chỉ hiển thị đáp án đúng khi người xem là Tác giả (`created_by = auth.uid()`) hoặc Giảng viên/Admin.
  - [x] Kiểm thử `ASM-ANSWER-01`: Thí sinh mở bài thi không thấy `is_correct` trong response.

- [x] **Task 3.3: Quản lý Phiên bản Đề thi Bất biến (Immutable Snapshot) — NEXA-18**
  - [x] Khi chuyển đề thi sang `PUBLISHED`, lưu toàn bộ câu hỏi/đáp án vào trường `snapshot_data JSONB`.
  - [x] Đợt thi/Campaign chỉ đọc từ snapshot đã xuất bản.

---

## Phase 4: Cách Ly Tenant & Báo Cáo 5 Miền Chuẩn Xác (campaign-and-analytics)

- [x] **Task 4.1: Cách ly Lớp học Cá nhân vs Tổ chức — NEXA-09**
  - [x] Trong `src/app/(dashboard)/personal/groups/page.tsx`: Lọc nghiêm ngặt `organization_id IS NULL`.
  - [x] Kiểm thử `CLASS-SCOPE-01`: Người dùng tham gia lớp của Org không bị lẫn vào danh sách nhóm cá nhân.

- [x] **Task 4.2: Truy vấn Campaign Detail theo đúng Đợt thi — NEXA-10, NEXA-20**
  - [x] Trong `src/app/(dashboard)/org/[slug]/campaigns/[id]/page.tsx`: Truy vấn bài nộp lọc theo `.eq('campaign_id', campaign.id).eq('organization_id', org.id)`.
  - [x] Đếm sĩ số thực tế từ danh sách lớp; hiển thị `0` khi lớp rỗng (xóa bỏ số `50` giả).
  - [x] Kiểm thử `CAMP-01`, `CAMP-02`, `CAMP-03`: Dữ liệu phân tách tuyệt đối giữa các đợt và các tổ chức.

- [x] **Task 4.3: Tích hợp domain_scores vào Org Analytics — NEXA-11**
  - [x] Trong `src/app/(dashboard)/org/[slug]/analytics/page.tsx`: Truy vấn `domain_scores` từ các bài thi đã chấm.
  - [x] Miền chưa có bài thi hiển thị `Chưa có dữ liệu` (`null`), không vẽ 0% giả.
  - [x] Kiểm thử `COMP-01`: Chỉ D1 và D4 có điểm thì các miền khác là `null`.

---

## Phase 5: Lưu Trữ Bền Vững & Chống Mock Toàn Hệ Thống (persisted-comms-settings)

- [x] **Task 5.1: Chuông Thông báo Lưu Database (Persistent Notifications) — NEXA-06**
  - [x] Tạo bảng `user_notifications` trong Migration 34.
  - [x] Viết API `/api/notifications` (danh sách, đánh dấu đọc).
  - [x] Cập nhật `NotificationBell.tsx` dùng API server, xóa sạch `localStorage`.
  - [x] Kiểm thử `NOTIF-01`: Thông báo đồng bộ trên nhiều thiết bị.

- [x] **Task 5.2: Cài đặt Tổ chức Lưu Database (Org Policies) — NEXA-05**
  - [x] Tạo bảng `organization_policies` theo từng `organization_id`.
  - [x] Viết API `GET` & `PATCH` `/api/org/[slug]/settings`.
  - [x] Cập nhật `OrgSettingsView.tsx`: Xóa hardcode FPT domains, lưu và tải dữ liệu thật.
  - [x] Kiểm thử `ORG-SETTING-01`, `ORG-SETTING-02`: Lưu thật vào DB, chặn MEMBER sửa cài đặt.

- [x] **Task 5.3: Hòm thư Góp ý Thật (Feedback Tickets) — NEXA-19**
  - [x] Tạo bảng `feedback_tickets` trong Migration 34.
  - [x] Viết API `POST` & `GET` & `PATCH` `/api/feedback`.
  - [x] Cập nhật `FeedbackModal.tsx` và Admin Inbox để đọc/ghi dữ liệu thật.
  - [x] Kiểm thử `FEEDBACK-01`: Góp ý gửi từ client xuất hiện trong Admin Inbox thật.

- [x] **Task 5.4: Xử lý Trung tâm Truyền thông Admin (Communications) — NEXA-04**
  - [x] Broadcast: Lưu vào DB `user_notifications` tạo thông báo cho toàn bộ người dùng qua API `/api/admin/broadcast`.
  - [x] Email hàng loạt: Gắn nhãn *"Tính năng đang phát triển — Kết nối Email Marketing Service"* và vô hiệu hóa nút gửi nếu chưa có queue (xóa bỏ hoàn toàn `setTimeout` giả lập).

- [x] **Task 5.5: Nhận Lời Mời Tổ Chức Nguyên Tử (Atomic Org Invite) — NEXA-14**
  - [x] Cập nhật `src/app/api/organizations/accept-invite/route.ts` với cơ chế claim PENDING nguyên tử và bù trừ lỗi.
  - [x] Kiểm thử `ORG-INVT-01`: Hai request đồng thời chỉ chấp nhận 1 lần và trừ 1 ghế.

- [x] **Task 5.6: Xuất CSV Tài Chính An Toàn Phía Server — NEXA-16**
  - [x] Viết API `/api/admin/transactions/export`: Xử lý streaming/server-side, trung hòa ký tự CSV Injection (`=, +, -, @`), thêm UTF-8 BOM (`\uFEFF`).
  - [x] Kiểm thử `PAY-CSV-01`: Xuất 500+ dòng an toàn font tiếng Việt.

---

## Phase 6: Kiểm Thử Toàn Diện & Đóng Gói Hoàn Thiện

- [x] **Task 6.1: Chạy toàn bộ 19 bài kiểm thử chấp nhận trong Spec**
- [x] **Task 6.2: Kiểm tra biên dịch TypeScript (`npm run typecheck` 0 lỗi)**
- [x] **Task 6.3: Kiểm tra toàn bộ Unit Test suite (`npm run test` 100% pass: 34 files, 163 tests)**
- [x] **Task 6.4: Kiểm tra build hệ thống (`npm run build` thành công 90/90 static/dynamic routes)**
