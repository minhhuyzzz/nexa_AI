# Danh Sách Công Việc Triển Khai (Todo List) — Nâng Cấp Platform Admin & Khắc Phục Lỗ Hổng Bảo Mật

> **Căn cứ kế hoạch:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Tài liệu nguồn:** [`NEXA_ADMIN_REVIEW_2026-10-30_abb463fa.md`](file:///c:/nexa/NEXA_ADMIN_REVIEW_2026-10-30_abb463fa.md)  
> **Quy chuẩn:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)

---

## Đợt 1: Bảo Mật P0 & Toàn Vẹn Khảo Thí (Security Gate)

- [x] **Task 1.1: Sửa Hàm `is_admin_or_service()` Trong PostgreSQL RLS (SEC-01)**
  - **Mô tả:** Viết migration `29_fix_security_definer_and_admin_helper.sql` thay thế hàm `public.is_admin_or_service()`. Loại bỏ hoàn toàn việc dùng `current_user` trong hàm `SECURITY DEFINER` (vì luôn trả về owner function `postgres`). Thay bằng kiểm tra claim role trong JWT `(auth.jwt() ->> 'role' = 'service_role')`, email superadmin từ JWT, hoặc role `ADMIN` trong bảng `profiles` thông qua `auth.uid()`. Đặt `SET search_path = public, auth`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Hàm không tự động trả về `TRUE` cho người dùng thông thường khi thực thi dưới chế độ `SECURITY DEFINER`.
    2. Chỉ `service_role` nội bộ hoặc tài khoản có role `ADMIN` trong `profiles` mới được trả về `TRUE`.
    3. Bộ test bảo mật kiểm tra hàm helper đạt 100% pass.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/tenant-security-rls.test.ts`
  - **Phụ thuộc:** Không
  - **Files:** `src/database/migrations/29_fix_security_definer_and_admin_helper.sql`, `src/features/billing/services/tenant-security-rls.test.ts`
  - **Size:** S (2 files, ~60 dòng)

- [x] **Task 1.2: Cưỡng Chế Server-Side Tenant Authz Cho GET Campaigns & Org APIs (SEC-02)**
  - **Mô tả:** Trong `src/app/api/organizations/[orgId]/campaigns/route.ts`, bổ sung hàm kiểm tra quyền truy cập ở hàm `GET`: người gọi bắt buộc phải có membership `ACTIVE` trong `orgId` (hoặc là Platform Superadmin). Kiểm tra tương tự đối với các API khác trong thư mục `src/app/api/organizations/[orgId]/**` để triệt tiêu hoàn toàn nguy cơ truy vấn chéo dữ liệu tổ chức bằng `createAdminClient()`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng thuộc Org A gọi GET Campaign của Org B nhận mã lỗi 403 / 404 và không nhận được bất kỳ dữ liệu nào.
    2. Thành viên hợp lệ của Org A xem được đầy đủ danh sách đợt đánh giá của đơn vị mình.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/assessments/services/assessment-campaign.service.test.ts`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/app/api/organizations/[orgId]/campaigns/route.ts`, `src/features/assessments/services/assessment-campaign.service.test.ts`
  - **Size:** S (2 files, ~70 dòng)

- [x] **Task 1.3: Xác Minh Sở Hữu Đề/Lớp & Giao Dịch Tạo Campaign (SEC-03)**
  - **Mô tả:** Trong `POST /api/organizations/[orgId]/campaigns/route.ts`, bắt buộc kiểm tra `assessment.organization_id = orgId` (hoặc đề mẫu `visibility = 'PUBLIC'`). Kiểm tra toàn bộ `classIds` và `assessorIds` thuộc sở hữu của `orgId`. Đảm bảo việc tạo đợt đánh giá và sinh `class_assignments` được kiểm tra lỗi nghiêm ngặt (nếu lỗi ở bất kỳ bước nào thì không tạo chiến dịch dở dang).
  - **Tiêu chuẩn nghiệm thu:**
    1. Không thể chọn đề thi hoặc lớp học của tổ chức khác để tạo đợt đánh giá.
    2. Lỗi sinh bài giao sẽ trả về mã lỗi và không ghi nhận đợt đánh giá dở dang trong DB.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/assessments/services/assessment-campaign.service.test.ts`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/app/api/organizations/[orgId]/campaigns/route.ts`
  - **Size:** M (1 file, ~90 dòng)

- [x] **Task 1.4: Hợp Nhất Canonical Platform Admin Guard (ADM-01)**
  - **Mô tả:** Chuẩn hóa hàm `requirePlatformAdmin(request)` trong `src/lib/auth/admin-guard.ts` thành cơ chế xác thực duy nhất cho toàn bộ Platform Admin. Áp dụng đồng bộ cho `src/app/(dashboard)/admin/layout.tsx` và toàn bộ các API route `/api/admin/**` (thay thế các đoạn kiểm tra email whitelist hoặc `profiles.role` rời rạc).
  - **Tiêu chuẩn nghiệm thu:**
    1. Mọi truy cập vào layout hoặc API Admin đều thông qua `requirePlatformAdmin`.
    2. Người dùng thông thường hoặc Org Admin gọi bất kỳ API Admin nào đều bị chặn ngay tại tầng máy chủ với mã lỗi 403.
  - **Lệnh kiểm chứng:** `npx vitest run src/app/api/admin/organizations/route.test.ts`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/lib/auth/admin-guard.ts`, `src/app/(dashboard)/admin/layout.tsx`, `src/app/api/admin/organizations/route.ts`, `src/app/api/admin/ai-gateway/route.ts`
  - **Size:** M (4 files, ~100 dòng)

- [x] **Checkpoint 1: Hoàn Tất Đợt 1 (Security Gate)**
  - Chạy `npm run typecheck` và `npx vitest run`. Đảm bảo 100% test bảo mật đa tenant, RLS và Platform Admin Guard đều vượt qua.

---

## Đợt 2: Trung Tâm Điều Hành Khách Hàng Business B2B

- [x] **Task 2.1: Pipeline Hồ Sơ Business Inquiries Trên Admin UI (ADM-02)**
  - **Mô tả:** Cập nhật trang `/admin/organizations` để kết nối trực tiếp với bảng `business_inquiries`. Hiển thị 2 tab lớn: **"Hồ sơ tư vấn (Inquiries)"** và **"Tổ chức đang hoạt động (Active Organizations)"**. Tab Inquiries phân loại theo 4 trạng thái: `NEW` (Mới), `CONTACTED` (Đã liên hệ), `PROPOSAL_SENT` (Đã gửi báo giá), `REJECTED` (Từ chối). Thêm modal cập nhật trạng thái liên hệ và ghi chú tư vấn.
  - **Tiêu chuẩn nghiệm thu:**
    1. Khách hàng gửi form từ Landing Page lập tức xuất hiện trong danh sách `NEW` của Admin.
    2. Admin có thể chuyển trạng thái hồ sơ sang `CONTACTED` kèm ghi chú lịch sử.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/app/(dashboard)/admin/organizations/page.tsx`, `src/app/api/admin/inquiries/route.ts`
  - **Size:** M (2 files, ~180 dòng)

- [x] **Task 2.2: Phê Duyệt Hợp Đồng & Cấp Entitlement Nguyên Tử (ADM-03)**
  - **Mô tả:** Trong `/api/admin/organizations/approve`, tái cấu trúc luồng phê duyệt: Chuyển trạng thái `business_inquiries` sang `APPROVED`, tạo bản ghi `organizations` và `organization_entitlements` (số ghế, số đề, AI credits, thời hạn hợp đồng), sinh lời mời cho `ORG_OWNER` đầu tiên. Nếu bước cấp entitlement thất bại, bắt buộc rollback trạng thái tổ chức, tuyệt đối không để tổ chức `ACTIVE` khi chưa có entitlement.
  - **Tiêu chuẩn nghiệm thu:**
    1. Phê duyệt thành công tạo đầy đủ: Tổ chức ACTIVE + Entitlement hợp đồng + Lời mời ORG_OWNER.
    2. Nếu có lỗi xảy ra ở bước cấp quyền, hệ thống trả về mã lỗi và không tạo tổ chức dở dang.
    3. Thử phê duyệt lặp lại một inquiry đã duyệt sẽ bị chặn an toàn (idempotent).
  - **Lệnh kiểm chứng:** `npx vitest run src/features/organizations/services/business-inquiry.service.test.ts`
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/app/api/admin/organizations/approve/route.ts`
  - **Size:** M (1 file, ~120 dòng)

- [x] **Task 2.3: Trang Công Khai Tiếp Nhận Mã Tham Gia `/join/org/[joinCode]` (ORG-06 / BUS-05)**
  - **Mô tả:** Xây dựng trang công khai `src/app/join/org/[joinCode]/page.tsx` dành cho học viên khi nhận được link tham gia từ trường học/doanh nghiệp. Trang hiển thị tên đơn vị, thông tin gói đào tạo, và nút "Gửi yêu cầu tham gia". Khi học viên bấm gửi, hệ thống kiểm tra tính hợp lệ của mã (chưa hết hạn, chưa vượt quá max_uses) và tạo bản ghi `membership_requests` trạng thái `PENDING` để Org Admin duyệt.
  - **Tiêu chuẩn nghiệm thu:**
    1. Mở link với mã hợp lệ hiển thị thông tin tổ chức rõ ràng.
    2. Mã hết hạn hoặc bị thu hồi hiển thị thông báo lỗi lịch sự, không cho gửi yêu cầu.
    3. Gửi yêu cầu thành công tạo bản ghi trong hàng đợi duyệt của Org Admin.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/join/org/[joinCode]/page.tsx`, `src/app/api/join/org/[joinCode]/route.ts`
  - **Size:** M (2 files, ~140 dòng)

- [x] **Checkpoint 2: Hoàn Tất Đợt 2 (Business B2B Flow)**
  - Chạy `npm run typecheck` và `npx vitest run`. Vòng đời khách hàng Business từ Tiếp nhận lead → Tư vấn → Phê duyệt hợp đồng → Kích hoạt → Nhận mã tham gia hoạt động trơn tru.

---

## Đợt 3: Quản Trị Tài Chính, AI Gateway, Người Dùng & Audit

- [x] **Task 3.1: Hoàn Thiện `POST /api/admin/ai-gateway` & Lưu Cấu Hình AI (ADM-04)**
  - **Mô tả:** Triển khai phương thức `POST` cho `src/app/api/admin/ai-gateway/route.ts` để lưu cấu hình nhà cung cấp AI (Gemini / OpenAI / Claude), model routing cho từng tác vụ (Chấm bài thực hành vs Phân tích năng lực), trần ngân sách chi phí, và rate limits. Validate dữ liệu đầu vào bằng Zod. Ẩn toàn bộ API key thô, chỉ lưu dạng đã mã hóa hoặc trong cấu hình an toàn.
  - **Tiêu chuẩn nghiệm thu:**
    1. Admin lưu cấu hình AI trên `/admin/settings` hoặc `/admin/ai-gateway` thành công (HTTP 200).
    2. Sau khi F5 tải lại trang, cấu hình mới được duy trì chính xác.
    3. Không để lộ API key thô trong response gửi về client.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Checkpoint 2
  - **Files:** `src/app/api/admin/ai-gateway/route.ts`, `src/app/(dashboard)/admin/settings/page.tsx`
  - **Size:** M (2 files, ~130 dòng)

- [x] **Task 3.2: Chuẩn Hóa Đối Soát Giao Dịch Thủ Công & Chống Duyệt Trùng (ADM-05)**
  - **Mô tả:** Cập nhật `POST /api/admin/transactions` trong `src/app/api/admin/transactions/route.ts`. Khi quản trị viên duyệt thủ công một giao dịch chuyển khoản ngân hàng (manual reconciliation), yêu cầu nhập đầy đủ: Mã tham chiếu ngân hàng (bank reference), minh chứng chuyển khoản, số tiền thực nhận và lý do duyệt. Gọi RPC đối soát bảo đảm tính duy nhất (idempotent), không cộng credits hoặc nâng gói lần thứ hai nếu giao dịch đã ở trạng thái `COMPLETED`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Bắt buộc nhập mã tham chiếu và lý do khi duyệt giao dịch thủ công.
    2. Duyệt 2 lần trên cùng một giao dịch sẽ bị từ chối và không nhân đôi credits.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/payment-webhook.test.ts`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/app/api/admin/transactions/route.ts`, `src/app/(dashboard)/admin/transactions/page.tsx`
  - **Size:** M (2 files, ~110 dòng)

- [x] **Task 3.3: Sửa Cập Nhật User Và Tách Bạch Quyền Creator/Org (ADM-06)**
  - **Mô tả:** Trong `src/app/(dashboard)/admin/users/page.tsx`, sửa hàm `handleSaveUser`: bắt buộc kiểm tra `res.ok` từ API PATCH. Nếu server trả về lỗi (403/500), hiển thị thông báo lỗi chi tiết, không cập nhật local state và không hiển thị thông báo thành công giả. Đồng thời, cấu trúc lại modal chỉnh sửa người dùng: tách rõ Gói cá nhân (`plan_tier: FREE/PRO`), Quyền sáng tạo đề thi cá nhân, và Danh sách vai trò trong các tổ chức.
  - **Tiêu chuẩn nghiệm thu:**
    1. Khi API trả về lỗi, giao diện hiển thị thông báo lỗi và giữ nguyên trạng thái cũ.
    2. Một người học có thể vừa là thành viên Org vừa có gói Pro cá nhân.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/app/(dashboard)/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`
  - **Size:** M (2 files, ~100 dòng)

- [x] **Task 3.4: Tách Bạch Gói Cá Nhân vs Hợp Đồng Business (ADM-08)**
  - **Mô tả:** Trong `/admin/plans` (`src/app/(dashboard)/admin/plans/page.tsx`), phân tách rõ ràng danh mục gói: **Gói Cá Nhân (Personal Subscriptions: Free, Pro)** với giá niêm yết và chu kỳ thanh toán tự động qua payOS; và **Khung Hạn Mức Doanh Nghiệp (Business Entitlements)** áp dụng theo hợp đồng tư vấn. Ngăn chặn việc chỉnh sửa catalog gói làm thay đổi âm thầm quyền lợi của các hợp đồng đang có hiệu lực.
  - **Tiêu chuẩn nghiệm thu:**
    1. Giao diện thể hiện rõ sự khác biệt giữa gói cá nhân và hợp đồng B2B.
    2. Chỉnh sửa giá gói cá nhân không ảnh hưởng tới hạn mức hợp đồng của các tổ chức đã ký kết.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.2
  - **Files:** `src/app/(dashboard)/admin/plans/page.tsx`, `src/app/api/admin/plans/route.ts`
  - **Size:** M (2 files, ~120 dòng)

- [x] **Task 3.5: Hệ Thống Audit Log Cho Tác Vụ Đặc Quyền Admin (ADM-13)**
  - **Mô tả:** Viết migration `30_create_admin_audit_logs.sql` tạo bảng `admin_audit_logs` (actor_id, action, target_type, target_id, old_values, new_values, ip_address, created_at) và xây dựng helper `logAdminAction()`. Ghi nhận toàn bộ các thao tác nhạy cảm: duyệt Business, duyệt giao dịch thủ công, thay đổi role/tier người dùng, lưu cấu hình AI Gateway.
  - **Tiêu chuẩn nghiệm thu:**
    1. Mọi hành động đặc quyền của Admin đều được ghi vào bảng `admin_audit_logs`.
    2. Giao diện `/admin/compliance` hiển thị bảng nhật ký kiểm toán hành vi quản trị minh bạch.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.2, Task 3.3
  - **Files:** `src/database/migrations/30_create_admin_audit_logs.sql`, `src/lib/audit/admin-audit.service.ts`, `src/app/(dashboard)/admin/compliance/page.tsx`
  - **Size:** M (3 files, ~130 dòng)

- [x] **Checkpoint 3: Hoàn Tất Đợt 3 (Finance, AI & Security Audit)**
  - Chạy `npm run typecheck` và `npx vitest run`. Đảm bảo luồng lưu cấu hình AI, đối soát giao dịch, cập nhật user an toàn và nhật ký audit log hoạt động đồng bộ.

---

## Đợt 4: Chuẩn Hóa Khảo Thí, Báo Cáo 5 Miền & Admin Control Plane

- [x] **Task 4.1: Sửa API Analytics 5 Miền Theo ID/Code & `null` vs `0` (ADM-07)**
  - **Mô tả:** Trong `src/app/api/admin/analytics/route.ts`, viết lại đoạn tổng hợp điểm 5 miền DigComp: Thay vì gán điểm theo vị trí mảng `idx + 1`, bắt buộc map theo mã định danh miền (`D1`..`D5`) hoặc `domain_id`. Khi một miền chưa có bất kỳ bài thi nào được hoàn thành, trả về `averageScore: null` (thay vì trả về `0` gây hiểu nhầm). Ghi rõ ngưỡng 70% là "Chuẩn mục tiêu NEXA".
  - **Tiêu chuẩn nghiệm thu:**
    1. Đảo thứ tự các phần tử trong mảng kết quả phân tích không làm sai lệch điểm của các miền.
    2. Miền chưa có dữ liệu hiển thị `Chưa có dữ liệu` (`null`), không hiển thị 0%.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Checkpoint 3
  - **Files:** `src/app/api/admin/analytics/route.ts`, `src/app/(dashboard)/admin/analytics/page.tsx`
  - **Size:** M (2 files, ~90 dòng)

- [x] **Task 4.2: Chuẩn Hóa Giám Sát Tuân Thủ & Bỏ Hardcode 100% (ADM-09)**
  - **Mô tả:** Trong `src/app/(dashboard)/admin/compliance/page.tsx`, xóa bỏ dòng chữ hardcode `"100% người dùng đã cấp quyền"`. Tính toán tỷ lệ đồng thuận người dùng thực tế dựa trên số bản ghi trong `privacy_consents` chia cho tổng số tài khoản hoạt động (`consentCount / totalUsersCount`). Tích hợp tab hiển thị nhật ký kiểm toán quản trị (`admin_audit_logs`) từ Task 3.5.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tỷ lệ đồng thuận hiển thị mẫu số và tử số thực tế từ DB.
    2. Bảng nhật ký kiểm toán hiển thị chi tiết các thao tác đặc quyền gần nhất.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.5
  - **Files:** `src/app/(dashboard)/admin/compliance/page.tsx`
  - **Size:** S (1 file, ~70 dòng)

- [x] **Task 4.3: Khóa Bất Biến Framework & Đề Thi Đã Phát Hành (ADM-10, ADM-11)**
  - **Mô tả:** Trong `/admin/frameworks` và `/admin/content`, thực thi quy tắc bất biến: Khi một Khung năng lực hoặc Đề thi đã phát hành (`PUBLISHED`) và đã có bài làm lịch sử, cấm sửa đổi câu hỏi hoặc tiêu chí trực tiếp. Để chỉnh sửa, hệ thống yêu cầu nhân bản sang phiên bản mới (`Clone to v2 / DRAFT`). Trong `/admin/contributions`, các đề cộng đồng khi được duyệt (`APPROVED`) sẽ chuyển vào Ngân hàng câu hỏi dùng chung chứ không tự động phát hành thành đề thi chính thức.
  - **Tiêu chuẩn nghiệm thu:**
    1. Đề thi đã có bài làm lịch sử không thể bị sửa nội dung câu hỏi tại chỗ.
    2. Nhân bản phiên bản đề thi mới giữ nguyên tính toàn vẹn của kết quả thi cũ.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 4.1
  - **Files:** `src/app/(dashboard)/admin/content/page.tsx`, `src/app/(dashboard)/admin/frameworks/page.tsx`, `src/app/api/admin/content/route.ts`
  - **Size:** M (3 files, ~140 dòng)

- [x] **Task 4.4: Tái Cấu Trúc Admin Sidebar IA & Dashboard Điều Hành (ADM-12, Section V)**
  - **Mô tả:** Cập nhật `src/components/dashboard/admin/AdminSidebar.tsx` thành 4 nhóm chuẩn theo Mục V của tài liệu review:
    1. **ĐIỀU HÀNH:** Trung tâm điều hành (`/admin/dashboard`), Báo cáo nền tảng (`/admin/analytics`).
    2. **KHÁCH HÀNG & KINH DOANH:** Quản lý người dùng (`/admin/users`), Khách hàng Business (`/admin/organizations`), Gói & Quyền lợi (`/admin/plans`), Thanh toán & Đối soát (`/admin/transactions`).
    3. **NỘI DUNG & KHẢO THÍ:** Đề thi hệ thống (`/admin/content`), Khung năng lực số (`/admin/frameworks`), Kiểm duyệt đề đóng góp (`/admin/contributions`).
    4. **HẠ TẦNG & AN TOÀN:** Quản trị AI Gateway (`/admin/ai-gateway`), Bảo mật & Kiểm toán (`/admin/compliance`), Cài đặt nền tảng (`/admin/settings`).
    Đồng thời, nâng cấp `src/app/(dashboard)/admin/dashboard/page.tsx` thay thế nút "Soạn đề thi mới" bằng **Hàng đợi công việc điều hành ưu tiên** (Hồ sơ B2B mới, Giao dịch cần đối soát, Cảnh báo AI, Trạng thái dịch vụ).
  - **Tiêu chuẩn nghiệm thu:**
    1. Sidebar Admin hiển thị 4 nhóm menu chuẩn xác, thẩm mỹ trung tính Slate/Sky, không emoji.
    2. Dashboard Admin ưu tiên các tác vụ điều hành cấp thiết nhất của chủ nền tảng.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 4.1, Task 4.2
  - **Files:** `src/components/dashboard/admin/AdminSidebar.tsx`, `src/app/(dashboard)/admin/dashboard/page.tsx`
  - **Size:** M (2 files, ~160 dòng)

- [x] **Task 4.5: Chuẩn Hóa Trải Nghiệm 12 Màn Hình Admin (ADM-14)**
  - **Mô tả:** Rà soát và hoàn thiện đồng bộ trải nghiệm trên toàn bộ 12 màn hình Platform Admin:
    1. Trạng thái tải: Skeleton loader mảnh hoặc spinner, không để màn hình giật lag.
    2. Trạng thái rỗng: Empty state trang trọng, hướng dẫn hành động tiếp theo.
    3. Trạng thái lỗi: Thông báo lỗi rõ ràng, có nút thử lại (retry), không nuốt lỗi biến thành 0 giả.
    4. Tuân thủ 100% quy chuẩn giao diện `AGENTS.md` (90% trung tính, 8% đen than, 2% xanh học thuật `#0284C7`, JetBrains Mono cho số/mã, icon Lucide nét mảnh `strokeWidth={1.75}`).
  - **Tiêu chuẩn nghiệm thu:**
    1. Không có màn hình nào nuốt lỗi query biến thành số 0 giả.
    2. Toàn bộ 12 trang Admin có loading state và empty state thanh lịch.
  - **Lệnh kiểm chứng:** `npm run typecheck` và `npm run build`
  - **Phụ thuộc:** Task 4.4
  - **Files:** `src/app/(dashboard)/admin/**/page.tsx`
  - **Size:** L (5-8 files, ~150 dòng)

- [x] **Checkpoint 4: Nghiệm Thu Toàn Diện Toàn Bộ 4 Đợt Triển Khai**
  - **Tiêu chuẩn nghiệm thu:**
    1. `npm run typecheck` đạt 0 lỗi (clean compilation).
    2. `npx vitest run` đạt 100% test suites pass.
    3. `npm run build` biên dịch thành công toàn bộ hệ thống.
    4. Không có bất kỳ vi phạm nào về quy tắc bảo mật đa tenant hoặc giao diện `AGENTS.md`.
