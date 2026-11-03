# Danh Sách Nhiệm Vụ Triển Khai: NEXA SaaS v3.0 (Cập Nhật Toàn Diện Sau Review 03/11/2026)

> **Tài liệu nguồn:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Căn cứ đánh giá:** Bản review chuyên gia 7.5/10 & [`NEXA_WORKSPACE_PERSONAL_ORG_UX_SPEC_2026-11-03.md`](file:///c:/Users/CPS/Downloads/NEXA_WORKSPACE_PERSONAL_ORG_UX_SPEC_2026-11-03.md)  
> **Quy chuẩn thực thi:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md), [`security-and-hardening`](file:///c:/nexa/.agents/skills/security-and-hardening/SKILL.md), [`planning-and-task-breakdown`](file:///c:/nexa/.agents/skills/planning-and-task-breakdown/SKILL.md).

---

## Phase 1: Khóa Bảo Mật & Dữ Liệu Credits (P0 - Security & Concurrency)

- [ ] **Task 1.1: Vá Lỗ Hổng Bảo Mật RPC `refund_ai_credits` & Triệt Tiêu Fallback Trực Tiếp**
  - **Mô tả:**
    1. Trong `src/database/migrations/39_secure_ai_credits_rpc.sql`: Thu hồi `EXECUTE` khỏi `authenticated` trên hàm `refund_ai_credits`, chỉ cấp cho `service_role`.
    2. Trong `src/features/billing/services/quota-enforcement.service.ts`: Xóa bỏ hoàn toàn các fallback `update` số dư trực tiếp trong `refundOrgAICredits` và `refundPersonalAICredits`.
    3. Đảm bảo mọi lời gọi RPC tổ chức dùng client có quyền `service_role`.
  - **Tiêu chí chấp nhận:**
    - [ ] Role `authenticated` không thể tự gọi RPC `refund_ai_credits` để tự cộng điểm.
    - [ ] Không còn nhánh cập nhật số dư bằng `update` client-side không có lock.
  - **Tệp:** `src/database/migrations/39_secure_ai_credits_rpc.sql`, `src/features/billing/services/quota-enforcement.service.ts`.

- [ ] **Task 1.2: Toàn Vẹn Idempotency Ledger `ai_credit_reservations`**
  - **Mô tả:**
    1. Trong `QuotaEnforcementService.reserveCredits`: Thực hiện insert bản ghi vào bảng `ai_credit_reservations` (`request_id`, `amount`, `payer_type`, `payer_id`, `status: 'RESERVED'`).
    2. Trong `settleOrReleaseCredits`: Kiểm tra trạng thái bản ghi trong DB, chỉ chuyển trạng thái nếu đang `RESERVED`. Chặn double refund / double settlement khi retry.
  - **Tiêu chí chấp nhận:**
    - [ ] Mọi yêu cầu giữ credit đều được lưu ledger durable trong DB.
    - [ ] Hoàn credit (RELEASE) lần thứ 2 với cùng `reservationId` không làm tăng số dư 2 lần.
  - **Tệp:** `src/features/billing/services/quota-enforcement.service.ts`, `src/features/billing/services/org-quota-enforcement.test.ts`.

- [ ] **Task 1.3: Khóa Atomic Claim Chống Duplicate Business Approval**
  - **Mô tả:**
    1. Trong `src/app/api/admin/organizations/approve/route.ts`: Chỉ claim inquiry cập nhật `status: 'IN_PROGRESS'` khi trạng thái hiện tại nằm trong `['NEW', 'CONTACTED', 'PROPOSAL_SENT']`.
    2. Loại bỏ hoàn toàn `'IN_PROGRESS'` khỏi điều kiện claim đầu vào.
  - **Tiêu chí chấp nhận:**
    - [ ] Hai yêu cầu phê duyệt đồng thời từ 2 admin chỉ có 1 yêu cầu thành công, yêu cầu thứ 2 nhận mã lỗi 409 Conflict.
    - [ ] 1 inquiry không bao giờ kích hoạt ra 2 tổ chức.
  - **Tệp:** `src/app/api/admin/organizations/approve/route.ts`.

---

## Checkpoint 1: Sau Phase 1
- [ ] Bảo mật RPC được khóa chặt.
- [ ] Concurrency tests cho claim inquiry và credit ledger đạt 100%.

---

## Phase 2: Khép Kín Trải Nghiệm Personal / Org / Member (P0 - Core Experience)

- [ ] **Task 2.1: Chặn Tất Cả Non-Admin Khỏi Organization Console**
  - **Mô tả:**
    1. Trong `src/lib/auth/org-guard.ts`: Cập nhật `VIEW_WORKSPACE: ['ORG_OWNER', 'ORG_ADMIN']`. Chặn tất cả `MEMBER`, `ASSESSOR`, `EVALUATOR`, `REPORT_VIEWER` khỏi `/org/[slug]/*` và redirect về `/personal/dashboard`.
    2. Trong `src/app/(dashboard)/org/[slug]/page.tsx`: Xóa bỏ việc render `OrgMemberOverviewView`. Toàn bộ trang này là Dashboard điều hành của Admin.
    3. Trong `src/components/dashboard/org/OrgSidebar.tsx`: Xóa bỏ nhánh menu `isMember`.
  - **Tiêu chí chấp nhận:**
    - [ ] Member truy cập trực tiếp URL `/org/[slug]` bị chặn và chuyển hướng về `/personal/dashboard`.
    - [ ] Admin truy cập bình thường.
  - **Tệp:** `src/lib/auth/org-guard.ts`, `src/app/(dashboard)/org/[slug]/page.tsx`, `src/components/dashboard/org/OrgSidebar.tsx`.

- [ ] **Task 2.2: Lọc Switcher Chỉ Hiển Thị Admin Org (Canva Style)**
  - **Mô tả:**
    1. Trong `src/components/dashboard/AvatarWorkspaceSection.tsx`: Lọc `workspaces`, chỉ hiển thị các tổ chức mà user có vai trò `ORG_OWNER` hoặc `ORG_ADMIN`.
    2. Member không thấy tổ chức trong switcher (chỉ thấy "Cá nhân" + nút "+ Tham gia tổ chức khác").
    3. Admin thấy "Cá nhân" + các tổ chức mình quản trị + nút "+ Mời thành viên".
  - **Tiêu chí chấp nhận:**
    - [ ] Tài khoản Member (`learner@nexa.edu.vn`) chỉ thấy "Cá nhân", không hiển thị tổ chức trong menu chuyển đổi.
    - [ ] Tài khoản Admin thấy các tổ chức được phân quyền.
  - **Tệp:** `src/components/dashboard/AvatarWorkspaceSection.tsx`.

- [ ] **Task 2.3: Đưa Đầy Đủ Lớp Tổ Chức Vào `/personal/groups`**
  - **Mô tả:**
    1. Trong `src/app/(dashboard)/personal/groups/page.tsx`: Xóa bỏ điều kiện lọc `!c.organization_id` ở dòng 149.
    2. Truy vấn quan hệ `organizations ( id, name, code, slug )`.
    3. Hiển thị badge nhãn tên tổ chức (VD: `Trường FPT Polytechnic`) dưới tên lớp.
  - **Tiêu chí chấp nhận:**
    - [ ] Các lớp thuộc trường/tổ chức hiển thị đầy đủ trong "Lớp & Nhóm" của thành viên.
    - [ ] Hiển thị badge tên tổ chức rõ ràng.
  - **Tệp:** `src/app/(dashboard)/personal/groups/page.tsx`.

- [ ] **Task 2.4: Đưa Cả `class_assignments` & `assessment_campaigns` Vào `/personal/submissions`**
  - **Mô tả:**
    1. Trong `src/app/(dashboard)/personal/submissions/page.tsx`: Truy vấn bài tập từ `class_assignments` (lớp cá nhân & lớp tổ chức) VÀ các đợt đánh giá từ `assessment_campaigns` mà lớp/học viên được giao.
    2. Hiển thị nhãn nguồn tổ chức rõ ràng trên từng thẻ bài.
    3. Thành viên làm bài, nộp bài, xem kết quả hoàn toàn trong Personal.
  - **Tiêu chí chấp nhận:**
    - [ ] Học viên nhận bài từ tổ chức thấy bài trong Personal.
    - [ ] Luồng làm bài, nộp bài, xem kết quả hoàn thành 100% trong Personal không cần mở `/org/[slug]`.
  - **Tệp:** `src/app/(dashboard)/personal/submissions/page.tsx`.

- [ ] **Task 2.5: Bỏ "Tổ Chức Của Tôi" Khỏi Personal Sidebar & Route Chuyển Tiếp**
  - **Mô tả:**
    1. Xóa mục `{ name: 'Tổ chức của tôi', href: '/personal/organizations', icon: Building2 }` khỏi `PersonalSidebar.tsx`.
    2. Route `src/app/(dashboard)/personal/organizations/page.tsx` thực hiện redirect an toàn về `/personal/groups`.
  - **Tiêu chí chấp nhận:**
    - [ ] Personal Sidebar không còn mục "Tổ chức của tôi".
    - [ ] Bookmark cũ truy cập `/personal/organizations` chuyển hướng mượt mà về `/personal/groups`.
  - **Tệp:** `src/components/dashboard/personal/PersonalSidebar.tsx`, `src/app/(dashboard)/personal/organizations/page.tsx`.

---

## Checkpoint 2: Sau Phase 2
- [ ] Luồng Member hoạt động 100% trong Personal (lớp học, bài tập, nộp bài, kết quả).
- [ ] Non-admin bị chặn khỏi Org Console.
- [ ] Switcher hiển thị chuẩn Canva.

---

## Phase 3: Ổn Định AI Grading & Billing (P1)

- [ ] **Task 3.1: Sửa Phân Quyền Service Role Cho AI Grading Call**
  - **Mô tả:**
    1. Trong `src/app/api/ai/grade-submission/route.ts`: Gọi `QuotaEnforcementService.reserveCredits` với client `service_role` (hoặc thông qua adminClient) để không bị chặn bởi Migration 39.
    2. Khi `ai_evaluations.insert` gặp `saveError`: gọi `settleOrReleaseCredits(..., 'RELEASE')` và trả về HTTP 500 rõ ràng.
  - **Tiêu chí chấp nhận:**
    - [ ] Chấm bài AI cho tổ chức thành công, không bị lỗi 403 Permission Denied khi trừ credits.
    - [ ] Lỗi lưu DB hoàn credit ngay lập tức cho người dùng.
  - **Tệp:** `src/app/api/ai/grade-submission/route.ts`.

- [ ] **Task 3.2: Kiểm Thử Toàn Diện Luồng Gia Hạn & Nâng Cấp Gói**
  - **Mô tả:**
    1. Kiểm thử endpoint `/api/organizations/[orgId]/renewal-requests` và `/api/admin/business/renewals/[id]/approve`.
    2. Xác minh công thức cộng dồn $\max(\text{now}, \text{current}) + \text{period}$.
    3. Kiểm tra nút "Gia hạn gói" trên `/personal/billing`.
  - **Tiêu chí chấp nhận:**
    - [ ] Gia hạn nhiều lần cộng dồn thời hạn chính xác.
  - **Tệp:** `src/app/api/organizations/[orgId]/renewal-requests/route.ts`, `src/app/(dashboard)/personal/billing/page.tsx`.

---

## Phase 4: Hoàn Thiện & Cách Ly Dữ Liệu Báo Cáo Organization (P2)

- [ ] **Task 4.1: Kiểm Tra Cách Ly Dữ Liệu Báo Cáo Cross-Tenant & CSV Export**
  - **Mô tả:**
    1. Kiểm tra API `/api/org/[slug]/analytics/export/route.ts`: Xác nhận query scoped chặt chẽ theo `organization_id` của slug đã được xác thực quyền.
    2. Kiểm tra bộ lọc Unit/Campaign trong `OrgAnalyticsDashboard.tsx`.
  - **Tiêu chí chấp nhận:**
    - [ ] Xuất báo cáo không làm lộ dữ liệu của tổ chức khác.
    - [ ] Dữ liệu hiển thị trung thực (không 0% giả).
  - **Tệp:** `src/app/api/org/[slug]/analytics/export/route.ts`, `src/features/analytics/components/OrgAnalyticsDashboard.tsx`.

---

## Phase 5: Tinh Giản UI, Dọn Nợ Kỹ Thuật & Tests Tổng Thể (P2)

- [ ] **Task 5.1: Dọn Dẹp Route & Component Cũ Đã Deprecate**
  - **Mô tả:**
    1. Gỡ bỏ hoặc gắn nhãn deprecate `OrgMemberOverviewView.tsx`.
    2. Cập nhật `docs/PRODUCT_MODEL.md` và `AGENTS.md` đúng với hiện trạng hệ thống.
  - **Tiêu chí chấp nhận:**
    - [ ] Mã nguồn sạch sẽ, không còn component thừa.
  - **Tệp:** `src/components/dashboard/org/OrgMemberOverviewView.tsx`, `docs/PRODUCT_MODEL.md`.

- [ ] **Task 5.2: Verification Suite Toàn Diện**
  - **Mô tả:**
    1. Chạy `npm run typecheck` (0 errors).
    2. Chạy `npm test` (toàn bộ tests pass).
    3. Viết test case concurrency cho atomic claim inquiry và credit reservation.
  - **Tiêu chí chấp nhận:**
    - [ ] 100% test suites passed.
    - [ ] 0 lỗi typecheck.
  - **Tệp:** Toàn bộ test suite.