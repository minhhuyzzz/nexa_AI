# KẾ HOẠCH TRIỂN KHAI KHẮC PHỤC 3 DASHBOARD (BẢN REVIEW `ce74dea`)
## IMPLEMENTATION PLAN: TRUE RUNTIME FIDELITY & SECURITY REMEDIATION

> **Căn cứ đặc tả:** [`docs/NEXA_SPEC_REMEDIATION_VNEXT_ce74dea.md`](file:///c:/nexa/docs/NEXA_SPEC_REMEDIATION_VNEXT_ce74dea.md)  
> **Căn cứ bản review:** [`NEXA_REVIEW_2026-10-31_ce74dea.md`](file:///c:/Users/CPS/Downloads/NEXA_REVIEW_2026-10-31_ce74dea.md)  
> **Quy chuẩn bắt buộc:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md) và [`planning-and-task-breakdown`](file:///c:/nexa/.agents/skills/planning-and-task-breakdown/SKILL.md)  
> **Nguyên tắc cốt lõi:** Vertical Slicing, Test-Driven Development, loại bỏ triệt để mọi hành vi mock, timeout giả lập thành công, hardcode số liệu và lệch schema.

---

## 1. Bản Đồ Phụ Thuộc (Dependency Graph)

```
[Migration 34: DB Foundation]
       │
       ├─── Module 1: auth-security-rbac (NEXA-01, 02, 03)
       │         │
       │         ├─── Module 2: item-bank-schema (NEXA-07, 08, 13, 17)
       │         │         │
       │         ├─── Module 3: assessment-integrity (NEXA-12, 18)
       │         │         │
       │         └─── Module 4: campaign-and-analytics (NEXA-09, 10, 11, 20)
       │
       └─── Module 5: persisted-comms-settings (NEXA-04, 05, 06, 14, 15, 16, 19)
```

---

## 2. Kế Hoạch Triển Khai Theo Từng Giai Đoạn (Vertical Slices)

### Phase 1: Nền tảng Bảo mật, Kiểm soát Phiên & RBAC Admin (`auth-security-rbac`)
*Mục tiêu: Đảm bảo "Buộc đăng xuất" và "Khóa tài khoản" có hiệu lực thực tế ngay lập tức trên server; phân quyền Admin theo hành động cụ thể.*

* **Task 1.1: Migration 34 — Cột kiểm soát phiên & Quyền Admin nội bộ**
  * Thêm `tokens_revoked_at TIMESTAMPTZ` vào bảng `profiles`.
  * Chuẩn hóa bảng/enum `admin_roles` và mapping năng lực (`SUPER_ADMIN`, `OPERATIONS_ADMIN`, `CONTENT_ADMIN`, `FINANCE_ADMIN`, `AI_OPERATOR`).
* **Task 1.2: Thu hồi phiên thực sự (Revoke Session Real Implementation) — `NEXA-01`**
  * Sửa API `POST /api/admin/users`: Khi Admin chọn `REVOKE_SESSION`, gọi `supabase.auth.admin.signOut(userId, 'global')` và cập nhật `tokens_revoked_at = NOW()`.
  * Cập nhật `getEffectiveUser.ts` và API guards: Nếu phiên phát hành trước `tokens_revoked_at`, từ chối 401.
* **Task 1.3: Cưỡng chế chặn tài khoản bị khóa (`is_suspended`) — `NEXA-02`**
  * Trong `src/middleware.ts`: Đọc `profile.is_suspended`. Nếu `true`, chuyển hướng về `/account-suspended`.
  * Trong `src/lib/auth/getEffectiveUser.ts`: Ném lỗi `403 Account Suspended`, chặn mọi API request.
  * Thêm màn hình thông báo thân thiện `/account-suspended` (hướng dẫn mở khóa, liên hệ hỗ trợ).
* **Task 1.4: Phân quyền Admin nội bộ theo Action (Granular Admin RBAC) — `NEXA-03`**
  * Xây dựng helper `requirePlatformPermission(permission)` kiểm tra vai trò cụ thể.
  * Bảo vệ API nhạy cảm: `FINANCE_ADMIN` mới được đối soát, `CONTENT_ADMIN` mới được duyệt đề, `AI_OPERATOR` chỉ xem giám sát AI.

---

### Phase 2: Toàn Vẹn Ngân Hàng Câu Hỏi & Phân Quyền Creator (`item-bank-schema`)
*Mục tiêu: Thống nhất Canonical Schema, sửa lỗi lệch bảng options, cấp quyền cho người dùng cá nhân (Personal Creator).*

* **Task 2.1: Migration 34 — Chuẩn hóa bảng `question_bank_items`**
  * Thêm cột `rubric_definition JSONB`, `owner_user_id UUID REFERENCES auth.users(id)`, `scope VARCHAR(20) DEFAULT 'PERSONAL'`.
  * Chuẩn hóa enum độ khó 4 bậc DigComp (`FOUNDATION`, `INTERMEDIATE`, `ADVANCED`, `HIGHLY_SPECIALIZED`).
* **Task 2.2: Chính sách RLS cho Creator Cá Nhân — `NEXA-08`**
  * Cho phép người dùng với vai trò `LEARNER` (gói Free/Pro) tạo, sửa và quản lý câu hỏi do chính mình sở hữu (`owner_user_id = auth.uid()`).
* **Task 2.3: `QuestionBankWriteService` dùng chung — `NEXA-07`, `NEXA-13`, `NEXA-17`**
  * Tạo service xử lý Transaction nguyên tử: ghi câu hỏi vào `question_bank_items` và ghi danh sách đáp án con vào bảng `question_bank_options`.
  * Ràng buộc bắt buộc gắn 1 trong 5 miền năng lực (`domain_id IN ('D1','D2','D3','D4','D5')`).
* **Task 2.4: Nâng cấp Editor & Importer câu hỏi**
  * Refactor `src/app/(dashboard)/personal/item-bank/[id]/page.tsx` sử dụng `QuestionBankWriteService`.
  * Refactor `ItemBankImporter.tsx` sử dụng `QuestionBankWriteService`, báo cáo số dòng thành công/lỗi chi tiết, loại bỏ schema lệch.

---

### Phase 3: Bảo Mật & Toàn Vẹn Bộ Đề Khảo Thí (`assessment-integrity`)
*Mục tiêu: Chặn lộ đáp án trắc nghiệm ở client, chuẩn hóa 404 cho UUID sai, quản lý phiên bản đề thi snapshot bất biến.*

* **Task 3.1: Route Detail Bộ Đề — UUID Validation & 404 — `NEXA-12`**
  * Kiểm tra tính hợp lệ của `params.id` bằng Zod/Regex UUID.
  * Nếu không phải UUID hợp lệ $\rightarrow$ trả về `notFound()` (HTTP 404), bãi bỏ triệt để lệnh `.limit(1)` lấy đề ngẫu nhiên.
* **Task 3.2: Sanitized DTO — Không truyền `is_correct` cho thí sinh — `NEXA-12`**
  * Tạo API Server trả về DTO đã được lọc: Đối với người làm bài/preview, loại bỏ hoàn toàn trường `is_correct` và `explanation`.
  * Chỉ trả về đáp án đúng khi người yêu cầu là Tác giả (`created_by = auth.uid()`) hoặc Giảng viên/Admin có thẩm quyền.
* **Task 3.3: Quản lý Phiên bản Đề thi Bất biến (Immutable Snapshot) — `NEXA-18`**
  * Khi xuất bản đề thi (`PUBLISHED`), lưu snapshot toàn bộ câu hỏi và đáp án vào trường `snapshot_data JSONB`.
  * Đợt thi/Campaign chỉ đọc từ snapshot này, ngăn việc câu hỏi gốc bị sửa làm sai lệch bài thi đang diễn ra.

---

### Phase 4: Cách Ly Tenant & Báo Cáo 5 Miền Chuẩn Xác (`campaign-and-analytics`)
*Mục tiêu: Tách biệt Lớp Personal và Org, truy vấn kết quả Campaign chuẩn theo đợt, tổng hợp 5 miền từ rubric evidence.*

* **Task 4.1: Cách ly Lớp học Cá nhân vs Tổ chức — `NEXA-09`**
  * Tại `/personal/groups`: Lọc truy vấn nghiêm ngặt `organization_id IS NULL`.
  * Lớp của tổ chức chỉ xuất hiện tại `/org/[slug]/classes`, nếu có link chuyển phải ghi rõ nhãn Org.
* **Task 4.2: Truy vấn Campaign Detail theo đúng Đợt thi — `NEXA-10`, `NEXA-20`**
  * Trong `/org/[slug]/campaigns/[id]`: Truy vấn submissions bắt buộc lọc theo `.eq('campaign_id', campaign.id).eq('organization_id', org.id)`.
  * Tính `totalAssigned` từ sĩ số thực của các lớp tham gia; nếu lớp trống $\rightarrow$ hiển thị `0`, xóa bỏ số `50` giả.
* **Task 4.3: Tích hợp `domain_scores` vào Org Analytics — `NEXA-11`**
  * Cập nhật API/Page `/org/[slug]/analytics`: Lấy `domain_scores` từ các bài thi đã được chấm/duyệt.
  * Biểu đồ chỉ vẽ trên miền có dữ liệu thật; miền chưa có bằng chứng hiển thị `Chưa có dữ liệu` (không vẽ 0% giả).

---

### Phase 5: Lưu Trữ Bền Vững & Chống Mock Toàn Hệ Thống (`persisted-comms-settings`)
*Mục tiêu: Loại bỏ hoàn toàn `setTimeout` giả lập, lưu chuông thông báo, chính sách tổ chức, góp ý và xuất CSV phía server.*

* **Task 5.1: Chuông Thông báo Lưu Database (Persistent Notifications) — `NEXA-06`**
  * Tạo bảng `user_notifications` trong Migration 34.
  * Viết API `/api/notifications` (lấy danh sách, đánh dấu đã đọc).
  * Refactor `NotificationBell.tsx` đọc/ghi qua API, loại bỏ hoàn toàn `localStorage`.
* **Task 5.2: Cài đặt Tổ chức Lưu Database (Org Policies) — `NEXA-05`**
  * Tạo bảng `organization_policies` (lưu allowlist domain, thời lượng, chính sách thi).
  * Viết API `GET` & `PATCH` `/api/org/[slug]/settings`.
  * Refactor `OrgSettingsView.tsx`: Xóa hardcode FPT domains, lưu thật vào DB, xóa cờ `isSaved` giả.
* **Task 5.3: Hòm thư Góp ý Thật (Feedback Tickets) — `NEXA-19`**
  * Tạo bảng `feedback_tickets` lưu góp ý từ Personal & Organization.
  * Viết API `POST /api/feedback` và kết nối trực tiếp vào Admin Inbox thật (xóa mock feedbacks).
* **Task 5.4: Xử lý Trung tâm Truyền thông Admin (Communications) — `NEXA-04`**
  * Với Broadcast: Lưu thông báo hệ thống vào DB để gửi tới chuông thông báo người dùng.
  * Với Email hàng loạt: Gắn nhãn *"Tính năng đang phát triển"* và vô hiệu hóa nút gửi nếu chưa có queue gửi thật (bỏ `setTimeout` báo thành công giả).
* **Task 5.5: Nhận Lời Mời Tổ Chức Nguyên Tử (Atomic Org Invite) — `NEXA-14`**
  * Tạo hàm RPC `accept_org_invitation_atomic` đảm bảo kiểm tra token, trừ ghế, kích hoạt membership và cập nhật trạng thái trong 1 transaction duy nhất.
* **Task 5.6: Xuất CSV Tài Chính An Toàn Phía Server — `NEXA-16`**
  * Viết API `/api/admin/transactions/export`: Xuất dữ liệu phía server theo khoảng thời gian, trung hòa ký tự CSV Injection (`=, +, -, @`), thêm UTF-8 BOM cho Excel tiếng Việt.

---

### Phase 6: Kiểm Thử Toàn Diện & Đóng Gói Hoàn Thiện
* **Task 6.1: Bộ Test Chấp Nhận 19 Kịch Bản**
  * Viết các bài test tự động cho toàn bộ 19 tiêu chí chấp nhận trong Spec (`AUTH-SUSP-01`, `AUTH-REV-01`, `RBAC-ADMIN-01`, `QB-01`, `CAMP-01`, `COMP-01`, v.v.).
* **Task 6.2: Kiểm tra Quy chuẩn & Build**
  * Chạy `npm run typecheck` (0 lỗi) — **ĐÃ HOÀN THÀNH**.
  * Chạy `npm run test` (34 files, 163/163 tests pass) — **ĐÃ HOÀN THÀNH**.
  * Chạy `npm run build` (Biên dịch thành công 90/90 routes) — **ĐÃ HOÀN THÀNH**.

---

## 3. Kết Quả Nghiệm Thu (Verification Summary)

* **Trạng thái:** Toàn bộ 6 Phase và 20 vấn đề (`NEXA-01` $\rightarrow$ `NEXA-20`) đã được khắc phục hoàn chỉnh.
* **TypeScript Typecheck:** 0 lỗi (`npm run typecheck`).
* **Unit & Integration Tests:** 34 test files, 163/163 tests passed (100%).
* **Production Build:** 90/90 static and dynamic routes compiled successfully (`npm run build`).
* **Tuân thủ quy chuẩn `AGENTS.md`:**
  - Không có dữ liệu giả lập, số liệu ảo (50, w-1/4), hay `setTimeout` báo thành công giả.
  - Áp dụng chuẩn bảo mật RLS, server authorization guards và khử CSV formula injection.
  - Chuẩn màu Cobalt `#2563EB`, Light trắng `#FFFFFF`, Dark đen `#000000`.
