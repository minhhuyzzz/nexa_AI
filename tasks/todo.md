# Danh Sách Nhiệm Vụ Triển Khai: NEXA AI Business Architecture & Security Overhaul

> Căn cứ tài liệu: `NEXA_REVIEW_PERSONAL_ORG_BUSINESS_2026-10-30_d7934984.md` và `AGENTS.md`.  
> Phương pháp tiếp cận: `incremental-implementation` qua 5 Giai đoạn tuần tự.

---

## Giai Đoạn 0: Bảo Mật, Cách Ly Tenant & Toàn Vẹn Dữ Liệu (Security Gate)

- [x] **Task 0.1: Sửa RLS `user_organizations` & Thu hồi quyền bảng quá rộng (ORG-F01)**
  - **Mô tả:** Viết migration SQL `25_harden_user_organizations_and_admin_rls.sql` để hủy bỏ chính sách `FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL ...)` và `FOR SELECT USING (true)`. Thu hồi toàn bộ quyền mutation của `anon`. Thiết lập chính sách RLS chuẩn: User chỉ đọc được membership của chính mình; Quản trị viên chỉ đọc/quản lý thành viên trong tổ chức mình quản trị qua hàm `SECURITY DEFINER` an toàn không đệ quy.
  - **Tiêu chuẩn nghiệm thu:**
    1. Anonymous không thể đọc hoặc sửa đổi bảng `user_organizations`.
    2. Member Org A không thể SELECT hoặc UPDATE thành viên Org B.
    3. Member không thể tự nâng role của mình trong tổ chức.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/tenant-security-rls.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/database/migrations/25_harden_user_organizations_and_admin_rls.sql`, `src/features/billing/services/tenant-security-rls.test.ts`
  - **Size:** M (2 files, ~140 dòng)

- [x] **Task 0.2: Bổ sung Server-Side Authorization cho API Quản lý Tổ chức của Platform Admin (ORG-F02)**
  - **Mô tả:** Cập nhật `src/app/api/admin/organizations/route.ts` và các route admin liên quan. Bổ sung helper kiểm tra quyền Platform Admin trên server (`isSuperadminEmail` hoặc role `PLATFORM_ADMIN`). Chặn hoàn toàn các request từ user thường trước khi query cơ sở dữ liệu. Validate dữ liệu đầu vào bằng Zod.
  - **Tiêu chuẩn nghiệm thu:**
    1. User thường gọi GET/POST/PATCH `/api/admin/organizations` bị trả về HTTP 401 hoặc 403 Forbidden ngay lập tức.
    2. Chỉ Platform Admin đã xác thực mới có quyền xem danh sách toàn bộ tổ chức hoặc thay đổi trạng thái kích hoạt.
  - **Lệnh kiểm chứng:** `npx vitest run src/app/api/admin/organizations/route.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/api/admin/organizations/route.ts`, `src/app/api/admin/organizations/route.test.ts`
  - **Size:** S (2 files, ~90 dòng)

- [x] **Task 0.3: Chuyển Cổng Thanh Toán payOS Sang Fail-Closed & Xóa Thông Tin Ngân Hàng Hardcoded (PERS-F01)**
  - **Mô tả:** Trong `src/features/billing/services/payment-verifier.service.ts`, xóa bỏ các hằng số `BANK_ID`, `ACCOUNT_NO`, `ACCOUNT_NAME` ghi cứng. Khi payOS không được cấu hình hoặc khởi tạo thất bại, service phải lập tức ném lỗi rõ ràng (`PAYOS_NOT_CONFIGURED` hoặc `PAYOS_GATEWAY_ERROR`), tuyệt đối không tạo giao dịch fallback bằng mã QR giả lập tài khoản mẫu.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không còn thông tin tài khoản ngân hàng cá nhân nào được ghi cứng trong mã nguồn.
    2. Khi payOS thiếu biến môi trường hoặc khởi tạo thất bại, API tạo phiên thanh toán trả về lỗi có ý nghĩa, không xuất QR.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/payment-verifier.service.test.ts`
  - **Phụ thuộc:** Không có
  - **Files:** `src/features/billing/services/payment-verifier.service.ts`, `src/features/billing/services/payment-verifier.service.test.ts`
  - **Size:** S (2 files, ~50 dòng)

- [x] **Task 0.4: Loại Bỏ Toàn Bộ Tên Model AI, Provider & Latency Khỏi Personal/Org UI (PERS-F03, ORG-F06)**
  - **Mô tả:** Làm sạch `src/app/api/ai/status/route.ts`, `src/app/(dashboard)/org/[slug]/ai-quota/page.tsx`, và `src/app/(dashboard)/personal/learning-path/page.tsx`. Xóa bỏ hoàn toàn việc hiển thị chuỗi tên model (`gemini-1.5-flash`), tên nhà cung cấp (`Google Gemini`) và độ trễ ping kỹ thuật. Client chỉ hiển thị trạng thái nghiệp vụ an toàn: "Hệ thống AI sẵn sàng", "Đang xử lý phân tích", số dư Credits và kết quả đánh giá.
  - **Tiêu chuẩn nghiệm thu:**
    1. API `/api/ai/status` không trả về tên model hoặc thông số kỹ thuật nội bộ cho client.
    2. Không còn bất kỳ màn hình nào của Personal hay Organization hiển thị tên model hay thời gian ping `~1.2s`.
  - **Lệnh kiểm chứng:** `npm run typecheck` và kiểm tra response của `/api/ai/status`
  - **Phụ thuộc:** Không có
  - **Files:** `src/app/api/ai/status/route.ts`, `src/app/(dashboard)/org/[slug]/ai-quota/page.tsx`, `src/app/(dashboard)/personal/learning-path/page.tsx`
  - **Size:** S (3 files, ~80 dòng)

- [x] **Checkpoint 0: Hoàn tất Giai đoạn 0**
  - Chạy `npm run typecheck` và `npx vitest run`. Xác nhận 100% kiểm thử bảo mật vượt qua. Hệ thống đạt chuẩn an toàn đa tenant trước khi xây dựng tính năng mới.

---

## Giai Đoạn 1: Business Onboarding & Quản Lý Thành Viên Quy Mô Lớn

- [x] **Task 1.1: Tách Biệt Bảng `business_inquiries` & Quy Trình Platform Admin Xét Duyệt Kích Hoạt (DEC-03)**
  - **Mô tả:** Tạo bảng `business_inquiries` lưu trữ yêu cầu liên hệ doanh nghiệp (tên tổ chức, người đại diện, email, điện thoại, quy mô, ghi chú, trạng thái `NEW / CONTACTED / APPROVED / REJECTED`). Cập nhật form `/api/organizations/inquiry` chỉ lưu vào bảng inquiry, không tạo tổ chức `ACTIVE`. Xây dựng endpoint cho Platform Admin phê duyệt inquiry, khởi tạo tổ chức `ACTIVE` và cấp `organization_entitlements` (số ghế, số đề, hạn mức AI, ngày hết hạn).
  - **Tiêu chuẩn nghiệm thu:**
    1. Gửi form liên hệ không tự động sinh ra tổ chức có thể đăng nhập được.
    2. Chỉ sau khi Admin duyệt, tổ chức mới được kích hoạt và gán vai trò `ORG_OWNER` cho người đại diện.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/organizations/services/business-inquiry.service.test.ts`
  - **Phụ thuộc:** Checkpoint 0
  - **Files:** `src/database/migrations/26_create_business_inquiries_and_entitlements.sql`, `src/app/api/organizations/inquiry/route.ts`, `src/app/api/admin/organizations/approve/route.ts`
  - **Size:** M (3 files, ~160 dòng)

- [x] **Task 1.2: Join Link / Join Code Có Hạn & Hàng Đợi Phê Duyệt (Approval Queue) (DEC-05)**
  - **Mô tả:** Tạo bảng `organization_join_codes` và `organization_membership_requests`. Quản trị viên tổ chức có thể tạo link/mã tham gia (có hạn sử dụng, giới hạn số lượt tham gia, có thể thu hồi). Thành viên truy cập link sẽ gửi yêu cầu gia nhập (trạng thái `PENDING`). Quản trị viên duyệt yêu cầu tại tab "Yêu cầu gia nhập" (có kiểm tra còn ghế khả dụng).
  - **Tiêu chuẩn nghiệm thu:**
    1. Mã tham gia hết hạn hoặc bị thu hồi sẽ bị từ chối.
    2. Link tham gia công khai chỉ cấp quyền `MEMBER`, tuyệt đối không cấp quyền quản trị.
    3. Hàng đợi phê duyệt cho phép duyệt hoặc từ chối ứng viên.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/organizations/services/join-code.service.test.ts`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/database/migrations/27_create_join_codes_and_approval_queue.sql`, `src/app/api/organizations/[orgId]/join-codes/route.ts`, `src/app/api/organizations/[orgId]/membership-requests/route.ts`, `src/app/(dashboard)/org/[slug]/members/OrgMembersClientView.tsx`
  - **Size:** M (4 files, ~200 dòng)

- [x] **Task 1.3: Import Thành Viên Hàng Loạt Qua File CSV/Excel Có Validation (DEC-05)**
  - **Mô tả:** Bổ sung tính năng tải lên danh sách thành viên bằng CSV/Excel trong trang Thành viên của tổ chức. Hệ thống kiểm tra: tính hợp lệ của email, loại bỏ email trùng lặp, cảnh báo nếu số lượng vượt quá số ghế còn lại của hợp đồng, và gửi lời mời hàng loạt an toàn.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tải lên file CSV hiển thị bản xem trước (preview) danh sách, số email hợp lệ và số email lỗi.
    2. Không cho phép gửi lời mời nếu vượt quá số ghế khả dụng.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/components/dashboard/org/BulkMemberImportModal.tsx`, `src/app/api/organizations/[orgId]/members/bulk-import/route.ts`
  - **Size:** M (2 files, ~150 dòng)

- [x] **Task 1.4: Thắt Chặt Bảo Mật Lời Mời & Chống Leo Thang Quyền (ORG-F08)**
  - **Mô tả:** Trong `/api/organizations/invite`, loại bỏ `ORG_OWNER` khỏi danh sách vai trò có thể mời thông thường (chuyển giao quyền sở hữu phải có luồng riêng). Trong `/api/organizations/accept-invite`, thực thi việc kiểm tra tổ chức còn hiệu lực, còn ghế trống và thực hiện upsert membership + cập nhật invitation trong một giao dịch nguyên tử (atomic transaction). Sửa lỗi redirect sử dụng `slug` thay vì `code`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Admin không thể gửi lời mời với quyền `ORG_OWNER`.
    2. Chấp nhận lời mời khi hết ghế hoặc tổ chức bị ngưng hoạt động sẽ bị từ chối rõ ràng.
    3. Redirect sau khi chấp nhận lời mời dẫn chính xác về `/org/[slug]`.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/organizations/services/invitation-security.test.ts`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/app/api/organizations/invite/route.ts`, `src/app/api/organizations/accept-invite/route.ts`, `src/app/(dashboard)/personal/accept-invite/page.tsx`
  - **Size:** S (3 files, ~80 dòng)

- [x] **Checkpoint 1: Hoàn tất Giai đoạn 1**
  - Chạy `npm run typecheck` và `npx vitest run`. Luồng liên hệ, duyệt hợp đồng, cấp ghế, join link, duyệt đơn và import CSV hoạt động trơn tru.

---

## Giai Đoạn 2: Workflow Khảo Thí Tổ Chức (Assessment Campaigns)

- [x] **Task 2.1: Quản Lý Đề Thi Tổ Chức & Cơ Chế Khóa Version (ORG-UI03)**
  - **Mô tả:** Xây dựng giao diện danh sách đề thi tổ chức tại `/org/[slug]/assessments` với bộ lọc trạng thái (`DRAFT / IN_REVIEW / APPROVED / PUBLISHED`). Khi đề thi đã được đưa vào sử dụng trong đợt đánh giá, hệ thống tự động đóng băng (lock version) nội dung câu hỏi và rubric để bảo đảm tính nhất quán của kết quả khảo thí.
  - **Tiêu chuẩn nghiệm thu:**
    1. Đề thi tổ chức hiển thị rõ phiên bản, tác giả và miền năng lực bao phủ.
    2. Đề thi đã phát hành không thể bị sửa đổi câu hỏi khi đã có học viên nộp bài.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/app/(dashboard)/org/[slug]/assessments/page.tsx`, `src/app/api/organizations/[orgId]/assessments/route.ts`
  - **Size:** M (2 files, ~160 dòng)

- [x] **Task 2.2: Xây Dựng Thực Thể Đợt Đánh Giá - Assessment Campaigns (DEC-07)**
  - **Mô tả:** Tạo bảng `assessment_campaigns` liên kết Đề thi với Danh sách Lớp, Thời gian mở/đóng, Phân công người chấm và Quy chế thi. Xây dựng trang quản lý Đợt đánh giá tại `/org/[slug]/campaigns` và trang chi tiết đợt đánh giá. Tự động sinh `class_assignments` tương ứng cho toàn bộ học viên trong các lớp tham gia.
  - **Tiêu chuẩn nghiệm thu:**
    1. Quản trị viên/Giảng viên có thể tạo đợt đánh giá, chọn đề thi và lớp tham gia.
    2. Học viên trong lớp lập tức nhìn thấy bài thi trong mục "Bài được giao" với hạn nộp chính xác.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/assessments/services/assessment-campaign.service.test.ts`
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/database/migrations/28_create_assessment_campaigns.sql`, `src/app/(dashboard)/org/[slug]/campaigns/page.tsx`, `src/app/api/organizations/[orgId]/campaigns/route.ts`
  - **Size:** M (3 files, ~220 dòng)

- [x] **Task 2.3: Giữ Toàn Bộ Luồng Chi Tiết Lớp Thuộc Shell Org (ORG-F07)**
  - **Mô tả:** Trong `/org/[slug]/classes/page.tsx`, sửa đường dẫn chi tiết lớp học để giữ nguyên Shell Organization (`/org/[slug]/classes/[classId]`), thay vì nhảy sang `/personal/groups/[classId]`. Đảm bảo breadcrumbs, context và thanh điều hướng duy trì đúng phạm vi của tổ chức.
  - **Tiêu chuẩn nghiệm thu:**
    1. Bấm vào chi tiết lớp học trong Org không bị chuyển hướng sang Personal.
    2. Giao diện hiển thị danh sách học viên, bài tập được giao và tiến độ làm bài trong khuôn khổ tổ chức.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/(dashboard)/org/[slug]/classes/page.tsx`, `src/app/(dashboard)/org/[slug]/classes/[classId]/page.tsx`
  - **Size:** M (2 files, ~150 dòng)

- [x] **Task 2.4: Bàn Chấm Bài Tổ Chức & Cơ Chế AI Gợi Ý Theo Yêu Cầu (HITL) (ORG-UI01)**
  - **Mô tả:** Xây dựng giao diện Bàn chấm bài cho tổ chức tại `/org/[slug]/grading`. Giảng viên được phân công có thể xem danh sách bài nộp, lọc theo đợt đánh giá, tự chấm điểm theo Rubric hoặc chủ động bấm nút "Nhờ AI chấm gợi ý" (HITL). AI chỉ đưa ra điểm nháp và trích dẫn bằng chứng; điểm số chính thức bắt buộc do người chấm duyệt.
  - **Tiêu chuẩn nghiệm thu:**
    1. Giảng viên mở bài nộp và chấm điểm trên cùng giao diện.
    2. AI chỉ được gọi khi bấm nút theo yêu cầu; kết quả AI không tự động công bố khi người chấm chưa duyệt.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.2, Task 2.3
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/page.tsx`, `src/app/api/organizations/[orgId]/grading/route.ts`
  - **Size:** M (2 files, ~180 dòng)

- [x] **Checkpoint 2: Hoàn tất Giai đoạn 2**
  - Chạy `npm run typecheck` và `npx vitest run`. Vòng đời khảo thí từ Soạn đề -> Mở đợt -> Giao lớp -> Làm bài -> Chấm Rubric hoàn thành trọn vẹn.

---

## Giai Đoạn 3: Báo Cáo Năng Lực 5 Miền & Can Thiệp Đào Tạo Cấp Tập Thể

- [x] **Task 3.1: Canonical Analytics 5 Miền Cấp Tổ Chức - Tách Biệt `null` vs `0` (ORG-F05, DEC-01)**
  - **Mô tả:** Cập nhật `/org/[slug]/analytics` và API tổng hợp năng lực tổ chức. Báo cáo đo lường trung thực trên đúng 5 miền DigComp. Phân biệt rõ: miền chưa ai làm bài hiển thị `null` (Chưa có dữ liệu); miền đã thi có điểm hiển thị chính xác; chỉ vẽ đa giác Radar khi có đầy đủ dữ liệu. Loại bỏ hoàn toàn việc hiển thị 21 kỹ năng con trên UI.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tổ chức mới chưa có dữ liệu hiển thị Empty State lịch thiệp, không vẽ đa giác 0% gây hiểu nhầm.
    2. Điểm trung bình các miền được tính chính xác từ các bài thi đã được phê duyệt kết quả.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/analytics/services/org-competency-analytics.test.ts`
  - **Phụ thuộc:** Checkpoint 2
  - **Files:** `src/app/(dashboard)/org/[slug]/analytics/page.tsx`, `src/app/api/organizations/[orgId]/analytics/route.ts`, `src/features/analytics/services/org-competency-analytics.service.ts`
  - **Size:** M (3 files, ~180 dòng)

- [x] **Task 3.2: So Sánh Tiến Bộ Giữa Các Đợt Đánh Giá & Báo Cáo Tỷ Lệ Đạt (DEC-07)**
  - **Mô tả:** Xây dựng tính năng so sánh kết quả 5 miền giữa các đợt đánh giá (ví dụ: Đầu năm vs Cuối năm, Trước đào tạo vs Sau đào tạo) cho từng lớp học hoặc toàn tổ chức. Hiển thị tỷ lệ hoàn thành (Mẫu số/Tử số rõ ràng) và tỷ lệ đạt chuẩn (>= 70%).
  - **Tiêu chuẩn nghiệm thu:**
    1. Biểu đồ so sánh trực quan điểm số 5 miền qua các đợt.
    2. Báo cáo tỷ lệ đạt chuẩn từng miền của các nhóm học viên.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/components/dashboard/org/CampaignComparisonChart.tsx`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`
  - **Size:** M (2 files, ~140 dòng)

- [x] **Task 3.3: Gợi Ý Học Liệu/Khóa Tuyển Chọn Theo Khoảng Trống Tập Thể (DEC-02)**
  - **Mô tả:** Tích hợp module đề xuất giải pháp đào tạo trong trang Analytics của tổ chức. Hệ thống quét các miền có tỷ lệ đạt chuẩn < 60% của tập thể, gợi ý các khóa học và học liệu đã kiểm duyệt từ `course_catalog` để nhà trường/doanh nghiệp đưa vào kế hoạch bồi dưỡng. Khẳng định rõ NEXA là công cụ chẩn đoán và phát triển, không phải sàn bán khóa học.
  - **Tiêu chuẩn nghiệm thu:**
    1. Gợi ý khóa học bám sát đúng khoảng trống năng lực tập thể của tổ chức.
    2. Liên kết mở trực tiếp trang nguồn chính thức của đơn vị cung cấp học liệu.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/components/dashboard/org/CohortLearningRecommendations.tsx`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`
  - **Size:** S (2 files, ~100 dòng)

- [x] **Checkpoint 3: Hoàn tất Giai đoạn 3**
  - Chạy `npm run typecheck` và `npx vitest run`. Báo cáo 5 miền, so sánh các kỳ và đề xuất đào tạo hoạt động đồng bộ.

---

## Giai Đoạn 4: Hạn Mức Hợp Đồng, Phân Quyền Sidebar & Hoàn Thiện UI/UX

- [x] **Task 4.1: Quota & AI Credits Ledger Theo Hợp Đồng Thật (ORG-F06, ORG-F10)**
  - **Mô tả:** Cập nhật trang `/org/[slug]/ai-quota` (đổi tên nhãn thành "Gói Dịch Vụ & Hạn Mức"). Tính toán mức tiêu thụ AI Credits từ bảng `ai_usage_events` theo đúng kỳ thanh toán/hợp đồng của tổ chức, không tính gộp 20 bản ghi gần nhất. Hiển thị rõ: Hạn mức được cấp theo hợp đồng, Đã sử dụng, Còn lại, và Ngày gia hạn tiếp theo.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không còn con số hardcode 10.000 credits.
    2. Dữ liệu credits phản ánh chính xác số dư thực tế từ cơ sở dữ liệu.
  - **Lệnh kiểm chứng:** `npx vitest run src/features/billing/services/org-quota-enforcement.test.ts`
  - **Phụ thuộc:** Checkpoint 3
  - **Files:** `src/app/(dashboard)/org/[slug]/ai-quota/page.tsx`, `src/features/billing/services/quota-enforcement.service.ts`
  - **Size:** M (2 files, ~120 dòng)

- [x] **Task 4.2: Tái Cấu Trúc Sidebar Organization Theo Vai Trò Người Dùng (ORG-UI08)**
  - **Mô tả:** Cập nhật `src/components/dashboard/org/OrgSidebar.tsx` theo ma trận phân quyền: Quản trị viên (`ORG_ADMIN`, `ORG_OWNER`) thấy toàn bộ menu điều hành; Người chấm/Giảng viên (`ASSESSOR`) chỉ thấy Lớp được phân, Đợt đánh giá và Bàn chấm; Thành viên/Học viên (`MEMBER`) chỉ thấy Lớp của tôi và Bài được giao; Người xem báo cáo (`REPORT_VIEWER`) chỉ thấy Báo cáo năng lực. Xóa bỏ nút chuyển về Personal ở cuối sidebar để tránh trùng lặp với Workspace Switcher ở topbar.
  - **Tiêu chuẩn nghiệm thu:**
    1. Sidebar hiển thị các chức năng tương ứng chính xác với vai trò của tài khoản.
    2. Tên vai trò hiển thị bằng tiếng Việt rõ ràng, trang trọng.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 4.1
  - **Files:** `src/components/dashboard/org/OrgSidebar.tsx`
  - **Size:** M (1 file, ~110 dòng)

- [x] **Task 4.3: Seed Bài Thi Baseline Thật Trong DB & Kiểm Thử Toàn Trình (PERS-F02, PERS-F07)**
  - **Mô tả:** Viết seed SQL `07_baseline_digcomp_assessment_seed.sql` tạo bài thi khảo thí Baseline 5 miền thật trong database (có câu hỏi, tiêu chí, rubric và trạng thái `PUBLISHED`). Trong `/api/assessments`, loại bỏ việc tự chèn đối tượng JSON mock khi DB rỗng. Chạy kiểm thử toàn trình đa vai trò (E2E) đảm bảo hệ thống đạt độ tin cậy sản xuất.
  - **Tiêu chuẩn nghiệm thu:**
    1. Bài thi baseline tồn tại thực tế trong DB, có thể mở làm bài, nộp bài và ghi nhận kết quả.
    2. `npm run typecheck` đạt 0 lỗi, `npx vitest run` đạt 100% test suites pass.
  - **Lệnh kiểm chứng:** `npm run typecheck` và `npx vitest run`
  - **Phụ thuộc:** Task 4.2
  - **Files:** `src/database/seeds/07_baseline_digcomp_assessment_seed.sql`, `src/app/api/assessments/route.ts`
  - **Size:** M (2 files, ~130 dòng)

- [x] **Checkpoint 4: Nghiệm Thu Toàn Bộ 5 Giai Đoạn**
  - **Tiêu chuẩn nghiệm thu:**
    1. Toàn bộ 5 Phase hoàn thành với 100% tiêu chí nghiệm thu.
    2. Đạt chuẩn bảo mật đa tenant, không rò rỉ dữ liệu.
    3. Trải nghiệm người dùng đồng nhất theo quy chuẩn `AGENTS.md`.
