# Danh Sách Nhiệm Vụ Triển Khai (Todo List): NEXA vNext

> **Căn cứ kế hoạch:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Đặc tả kỹ thuật:** [`docs/NEXA_SPEC_3_DASHBOARD_VNEXT.md`](file:///c:/nexa/docs/NEXA_SPEC_3_DASHBOARD_VNEXT.md)  
> **Quy chuẩn:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)  
> **Thứ tự thực hiện:** Theo luồng phụ thuộc từ Giai đoạn 1 đến Giai đoạn 7.

---

## Giai Đoạn 1: Identity, Avatar Workspace Switcher & 3-Plan Business Onboarding (`MOD-AUTH-WS`)

- [x] **Task 1.1: Chuyển Workspace Switcher vào Avatar Menu & Gỡ Dropdown trên Topbar**
  - **Mô tả:** Đưa toàn bộ danh sách chuyển đổi không gian làm việc (Personal, Org A, Org B, Platform Admin) vào trong dropdown menu của Avatar (`PersonalAvatarMenu.tsx` và `OrgAvatarMenu.tsx`). Tinh gọn Topbar, chỉ hiển thị tên Org/Breadcrumb và Avatar. Khi chuyển Org, chuyển đổi toàn bộ context và làm mới cache.
  - **Tiêu chuẩn nghiệm thu:**
    1. Bấm vào Avatar hiển thị danh sách các không gian làm việc của người dùng và trạng thái vai trò tương ứng.
    2. Dropdown chọn không gian cũ trên Topbar được gỡ bỏ hoàn toàn.
    3. Đổi không gian cách ly 100% dữ liệu, không có rò rỉ dữ liệu chéo giữa các Org.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `api-and-interface-design` | Agent: `security-auditor`
  - **Files:** `src/components/dashboard/personal/PersonalAvatarMenu.tsx`, `src/components/dashboard/org/OrgAvatarMenu.tsx`, `src/components/dashboard/personal/PersonalTopNav.tsx`, `src/components/dashboard/org/OrgTopNav.tsx`
  - **Size:** M (~120 dòng)

- [x] **Task 1.2: Chuẩn Hóa 3 Gói Thương Mại & Luồng Cấp Org Business Fail-closed Qua Token Email**
  - **Mô tả:** Cố định duy nhất 3 gói dịch vụ: `Free`, `Pro`, `Business`. Xóa bỏ các nút checkout online cho Business; chuyển thành form "Liên hệ tư vấn". Xây dựng endpoint và service cấp Org Business qua token kích hoạt gửi về email đại diện (hỗ trợ cả người chưa có tài khoản đăng ký và tự động nhận vai trò `ORG_OWNER`).
  - **Tiêu chuẩn nghiệm thu:**
    1. Gói Business không có cổng thanh toán online, chỉ có form gửi yêu cầu tư vấn.
    2. Admin duyệt yêu cầu tạo bản ghi Org `PENDING_OWNER` và sinh email invitation kèm token.
    3. Người nhận chưa có tài khoản có thể đăng ký tài khoản với email cố định theo token và tự động kích hoạt `ORG_OWNER`.
  - **Lệnh kiểm chứng:** `npm test src/features/organizations/services/invitation-security.test.ts`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `security-and-hardening`, `api-and-interface-design` | Agent: `security-auditor`
  - **Files:** `src/app/(dashboard)/pricing/page.tsx`, `src/features/organizations/services/business-inquiry.service.ts`, `src/app/api/admin/organizations/route.ts`, `src/app/api/auth/register-owner/route.ts`
  - **Size:** M (~140 dòng)

- [x] **Checkpoint 1: Kiểm Tra Hoàn Tất Phân Hệ Định Danh & Workspace**
  - Chạy `npm run typecheck`
  - Chạy `npm test src/features/organizations/services/invitation-security.test.ts`

---

## Giai Đoạn 2: Ngân Hàng Câu Hỏi Tái Sử Dụng & Assessment Studio 5-Tab Detail (`MOD-ITEM-BANK`, `MOD-ASSESS-ED`)

- [x] **Task 2.1: Tái Cấu Trúc Ngân Hàng Câu Hỏi Độc Lập (Reusable Item Bank & Full-page Editor)**
  - **Mô tả:** Tách biệt câu hỏi thành tài nguyên tái sử dụng (Reusable Items). Bổ sung taxonomy tag 21 kỹ năng thành phần, độ khó, ảnh minh họa. Xóa bỏ modal dài 700 dòng, chuyển thành trang xem/sửa chi tiết câu hỏi (`/personal/item-bank/[id]`). Bổ sung wizard import câu hỏi có preview xác minh từng dòng.
  - **Tiêu chuẩn nghiệm thu:**
    1. Câu hỏi trong ngân hàng có đầy đủ mã câu, tag 21 kỹ năng, ảnh minh họa và rubric.
    2. Mở câu hỏi chuyển sang trang chi tiết chuyên dụng, không dùng modal dài.
    3. Import câu hỏi có bước xem trước dạng bảng và cảnh báo lỗi cú pháp từng dòng.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `impeccable`, `frontend-ui-engineering` | Agent: `code-reviewer`
  - **Files:** `src/app/(dashboard)/personal/item-bank/page.tsx`, `src/app/(dashboard)/personal/item-bank/[id]/page.tsx`, `src/features/assessments/components/ItemBankImporter.tsx`
  - **Size:** L (~180 dòng)

- [x] **Task 2.2: Tách Rời Thời Gian Khỏi Studio & Xây Dựng Trang Detail Bộ Đề 5 Tab**
  - **Mô tả:** Trong Assessment Studio, gỡ bỏ cài đặt ngày giờ mở/đóng đợt thi (chỉ giữ thời lượng ước tính). Xây dựng trang Chi tiết bộ đề (`/personal/assessments/[id]`) gồm 5 tab: `Tổng quan` (với ảnh bìa vuông 1:1), `Danh sách câu hỏi`, `Ma trận 5 miền & Rubric`, `Lịch sử phiên bản` (khóa bất biến khi đã có bài thi), `Lần triển khai` (nút tạo Campaign / Live Room).
  - **Tiêu chuẩn nghiệm thu:**
    1. Assessment Studio không còn chứa trường ngày mở/đóng đợt thi.
    2. Trang Detail hiển thị đủ 5 tab chức năng, thẻ bài thi có ảnh bìa vuông 1:1 chuẩn quy cách.
    3. Đề thi đã có bài làm bị khóa bất biến phiên bản (chỉ đọc, muốn sửa phải clone thành version mới).
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.1
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `impeccable` | Agent: `code-reviewer`
  - **Files:** `src/features/assessments/components/AssessmentStudio.tsx`, `src/app/(dashboard)/personal/assessments/[id]/page.tsx`, `src/components/dashboard/assessments/AssessmentDetailTabs.tsx`
  - **Size:** L (~200 dòng)

- [x] **Checkpoint 2: Kiểm Tra Ngân Hàng Câu Hỏi & Trang Chi Tiết Bộ Đề**
  - Chạy `npm run typecheck`
  - Đảm bảo biên dịch không lỗi và route Detail 5 tab hoạt động trơn tru.

---

## Giai Đoạn 3: Triển Khai Thi — Campaign Wizard & Phòng Thi Trực Tiếp (`MOD-DELIVERY`)

- [x] **Task 3.1: Nâng Cấp Campaign Management & Trang Chi Tiết Đợt Thi (Campaign Detail)**
  - **Mô tả:** Hoàn thiện Campaign Wizard 5 bước (Thông tin đợt, Chọn đề thi version hợp lệ, Chọn lớp học, Lịch mở/đóng & Thời lượng làm bài, Phân công người chấm). Xây dựng trang Chi tiết Campaign (`/org/[slug]/campaigns/[id]`) với thanh tiến độ KPI thật (Được giao, Đang làm, Đã nộp, Chờ chấm, Đã duyệt) và danh sách bài nộp.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tạo chiến dịch thi bằng wizard 5 bước lưu đầy đủ lịch thi và phân công người chấm nguyên tử.
    2. Trang Chi tiết Campaign hiển thị KPI thật theo bài nộp, có bộ lọc theo lớp và trạng thái chấm.
  - **Lệnh kiểm chứng:** `npm test src/features/assessments/services/assessment-campaign.service.test.ts`
  - **Phụ thuộc:** Task 2.2
  - **Chuyên trách:** Skill: `api-and-interface-design`, `frontend-ui-engineering` | Agent: `test-engineer`
  - **Files:** `src/app/(dashboard)/org/[slug]/campaigns/new/page.tsx`, `src/app/(dashboard)/org/[slug]/campaigns/[id]/page.tsx`, `src/features/assessments/services/assessment-campaign.service.ts`
  - **Size:** M (~150 dòng)

- [x] **Task 3.2: Tách Bạch & Hoàn Thiện 5 Phân Hệ Phòng Thi Trực Tiếp (Live Room & Control Room)**
  - **Mô tả:** Tách biệt form tạo phòng khỏi danh sách phòng. Chuẩn hóa 5 phân hệ: Danh sách phòng, Setup phiên (chọn đề, thời lượng, cảnh báo tab-switch, sinh PIN/QR), Lobby sảnh chờ (`/live/waiting-room`), Control Room giám thị trực tiếp (`/live/control` theo dõi ai làm, ai rời tab, nút cộng giờ/thu bài), và Tổng kết phòng thi.
  - **Tiêu chuẩn nghiệm thu:**
    1. Personal không gọi API admin để lấy danh sách đề; gọi qua endpoint hợp lệ của cá nhân.
    2. Control Room cho phép giám thị bắt đầu tính giờ, giám sát cảnh báo tab-switch và thu bài.
    3. Sau khi kết thúc, điểm trắc nghiệm được tính ngay và bài tự luận chuyển vào hàng đợi chấm.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.2
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `api-and-interface-design` | Agent: `test-engineer`
  - **Files:** `src/app/(dashboard)/personal/live-room/page.tsx`, `src/app/live/control/page.tsx`, `src/app/live/waiting-room/page.tsx`
  - **Size:** M (~140 dòng)

- [x] **Checkpoint 3: Kiểm Tra Hoàn Tất Khâu Triển Khai Thi**
  - Chạy `npm test`
  - Xác nhận Campaign Detail và Live Control Room hoạt động ổn định.

---

## Giai Đoạn 4: Hồ Sơ Năng Lực Trong Profile, Lộ Trình Hành Động & Lớp/Nhóm Cá Nhân (`MOD-PROFILE`, `MOD-PERSONAL-GROUPS`)

- [x] **Task 4.1: Tích Hợp Hồ Sơ Năng Lực 5 Miền Vào Hồ Sơ Cá Nhân & Tái Thiết Kế Lộ Trình Hành Động**
  - **Mô tả:** Đưa báo cáo năng lực 5 miền hiện tại vào tab trong trang Hồ sơ cá nhân (`/personal/profile`), hiển thị Bar Chart chuẩn hóa, bằng chứng bài thi, chứng chỉ và lịch sử tiến bộ (`score: null` nếu chưa có dữ liệu, không vẽ 0% giả). Tái thiết kế trang Lộ trình phát triển (`/personal/learning-path`) thành Action Plan: mục tiêu nâng bậc miền, checklist học liệu đã kiểm duyệt, mốc đánh giá lại và nút gọi NEXA Guide AI on-demand có hỏi credit.
  - **Tiêu chuẩn nghiệm thu:**
    1. Hồ sơ cá nhân tích hợp đầy đủ điểm 5 miền đã kiểm chứng, không lặp lại radar vô nghĩa.
    2. Lộ trình phát triển có mục tiêu cụ thể, checklist bài học thực tế từ catalog đã duyệt và mốc thi lại.
    3. Nút "Phân tích bằng NEXA Guide" có modal xác nhận chi phí 1 credit trước khi chạy.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `impeccable`, `frontend-ui-engineering` | Agent: `web-performance-auditor`
  - **Files:** `src/app/(dashboard)/personal/profile/page.tsx`, `src/app/(dashboard)/personal/learning-path/page.tsx`, `src/components/dashboard/personal/CompetencyProfileTab.tsx`
  - **Size:** L (~190 dòng)

- [x] **Task 4.2: Tái Cấu Trúc Module "Lớp & Nhóm" Cá Nhân 3 Tab (Tôi tham gia / Tôi quản lý / Lời mời)**
  - **Mô tả:** Đổi tên và tái thiết kế module Nhóm trên Sidebar thành "Lớp & Nhóm (Classes & Groups)". Chia 3 tab rõ ràng: Tôi tham gia (học viên), Tôi quản lý (nhóm do mình tự mở, có công cụ thêm thành viên, giao đề, xem điểm), và Lời mời tham gia. Cách ly 100% với Lớp học thuộc các Tổ chức Business.
  - **Tiêu chuẩn nghiệm thu:**
    1. Giao diện chia 3 tab rõ ràng, hỗ trợ tự tạo và quản lý nhóm học tập riêng.
    2. Giao bài thi cho nhóm lấy từ kho Bộ đề cá nhân.
    3. Lớp cá nhân độc lập tuyệt đối với lớp của Tổ chức Business.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `impeccable` | Agent: `code-reviewer`
  - **Files:** `src/app/(dashboard)/personal/groups/page.tsx`, `src/app/(dashboard)/personal/groups/[groupId]/page.tsx`
  - **Size:** M (~130 dòng)

- [x] **Checkpoint 4: Kiểm Tra Profile Năng Lực, Lộ Trình & Nhóm Cá Nhân**
  - Chạy `npm run typecheck`

---

## Giai Đoạn 5: Tổ Chức Business — RBAC 5 Vai Trò, Báo Cáo BI & Quản Trị Hợp Đồng (`MOD-ORG-MGMT`)

- [x] **Task 5.1: Hoàn Thiện RBAC 5 Vai Trò Org, Quản Trị Link Tham Gia & Bộ Lọc Thành Viên**
  - **Mô tả:** Triển khai và kiểm tra nghiêm ngặt 5 vai trò Org (`ORG_OWNER`, `ORG_ADMIN`, `ASSESSOR`, `REPORT_VIEWER`, `MEMBER`). Bổ sung bộ lọc chọn Vai trò, Lớp học và Trạng thái trên trang thành viên. Quản lý Link/Mã tham gia như một tài nguyên (tên mã, vai trò gán mặc định, giới hạn lượt dùng, hạn dùng, tùy chọn tự động duyệt hoặc chờ Admin duyệt, nút thu hồi mã).
  - **Tiêu chuẩn nghiệm thu:**
    1. Trang thành viên có bộ lọc theo vai trò, lớp và trạng thái; thành viên vai trò `MEMBER` bị chặn xem danh sách thành viên khác.
    2. Tạo mã tham gia cho phép đặt số lượt, hạn dùng và tùy chọn duyệt.
    3. Nút thu hồi mã vô hiệu hóa link ngay lập tức.
  - **Lệnh kiểm chứng:** `npm test src/features/organizations/services/join-code.service.test.ts`
  - **Phụ thuộc:** Task 1.1
  - **Chuyên trách:** Skill: `security-and-hardening`, `frontend-ui-engineering` | Agent: `security-auditor`
  - **Files:** `src/app/(dashboard)/org/[slug]/members/OrgMembersClientView.tsx`, `src/features/organizations/services/join-code.service.ts`, `src/features/organizations/services/invitation-security.service.ts`
  - **Size:** L (~180 dòng)

- [x] **Task 5.2: Báo Cáo BI Năng Lực Tổ Chức & Module Hợp Đồng Hạn Mức (Thay thế AI-Quota)**
  - **Mô tả:** Xây dựng Org BI Dashboard (`/org/[slug]/analytics`): bộ lọc theo Campaign/lớp, biểu đồ cột so sánh 5 miền giữa các lớp, Heatmap lớp x miền, biểu đồ xu hướng tiến bộ qua các kỳ thi, nút xuất báo cáo Excel/PDF. Thay thế trang `ai-quota` cũ thành module "Hợp đồng & Hạn mức (Contract & Usage)": hiển thị số ghế (`45/200`), số đợt thi (`12/50`), AI credits (`1.240/10.000`) và nhật ký sử dụng (Usage Ledger).
  - **Tiêu chuẩn nghiệm thu:**
    1. Báo cáo BI hiển thị phân bổ 5 miền và heatmap trực quan, không dùng duy nhất một radar.
    2. Trang Hợp đồng & Hạn mức hiển thị thông tin hợp đồng thật và nhật ký trừ credits minh bạch, không còn hiển thị `0/0`.
  - **Lệnh kiểm chứng:** `npm test src/features/analytics/services/org-competency-analytics.test.ts`
  - **Phụ thuộc:** Task 3.1
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `impeccable` | Agent: `web-performance-auditor`
  - **Files:** `src/app/(dashboard)/org/[slug]/analytics/page.tsx`, `src/app/(dashboard)/org/[slug]/ai-quota/page.tsx`, `src/features/analytics/services/org-competency-analytics.service.ts`
  - **Size:** L (~190 dòng)

- [x] **Task 5.3: Chuẩn Hóa Cài Đặt Tổ Chức (Domain Allowlist & Chính Sách Khảo Thí)**
  - **Mô tả:** Tái thiết kế trang Cài đặt Org (`/org/[slug]/settings`): tab Thông tin đơn vị, tab Miền email cho phép (Domain Allowlist, ví dụ: `@fpt.edu.vn`), tab Chính sách khảo thí mặc định (giám sát tab-switch), tab Hợp đồng & Đóng góp ý kiến cho NEXA. Xóa bỏ toàn bộ các fallback số giả `max_seats = 50`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Cài đặt miền email cho phép chặn người dùng có email ngoài danh sách tham gia qua link.
    2. Giao diện cài đặt sạch sẽ, chuyên nghiệp, không có số liệu giả lập.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 5.1
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `security-and-hardening` | Agent: `code-reviewer`
  - **Files:** `src/app/(dashboard)/org/[slug]/settings/page.tsx`
  - **Size:** M (~120 dòng)

- [x] **Checkpoint 5: Kiểm Tra Hoàn Tất Không Gian Tổ Chức Business**
  - Chạy `npm test`
  - Xác nhận RBAC Org, BI Dashboard và Cài đặt hoạt động chuẩn mực.

---

## Giai Đoạn 6: Platform Admin Control Plane & Trung Tâm Vận Hành (`MOD-ADMIN-CP`, `MOD-ADMIN-BI`)

- [x] **Task 6.1: Tái Thiết Kế Admin Control Center Với Hàng Đợi Action Queues & Phân Tích BI**
  - **Mô tả:** Tái thiết kế `/admin/dashboard` tập trung vào Hàng đợi công việc cần xử lý ngay (Hồ sơ Business mới, giao dịch thanh toán chờ đối soát, đề chờ duyệt, sự cố AI) và 4 KPI sức khỏe nền tảng. Xây dựng module Phân tích BI riêng biệt (`/admin/analytics`): phễu chuyển đổi người dùng, phân tích 5 miền năng lực toàn hệ thống, doanh thu theo quý và xuất dữ liệu CSV.
  - **Tiêu chuẩn nghiệm thu:**
    1. Màn hình chính Admin ưu tiên hàng đầu các Action Queues, bấm vào chuyển ngay tới trang xử lý.
    2. Trang Phân tích BI cung cấp các báo cáo chuyên sâu và nút xuất dữ liệu chuẩn hóa.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Chuyên trách:** Skill: `api-and-interface-design`, `impeccable` | Agent: `code-reviewer`
  - **Files:** `src/app/(dashboard)/admin/dashboard/page.tsx`, `src/app/(dashboard)/admin/analytics/page.tsx`
  - **Size:** L (~190 dòng)

- [x] **Task 6.2: Quản Lý Khóa Tài Khoản (Suspend User) & Workbench Đối Soát Tài Chính Đa Trạng Thái**
  - **Mô tả:** Trên trang `/admin/users`: bổ sung chức năng tạm khóa tài khoản (Suspend User) kèm lý do, thời hạn và audit log; nút Buộc đăng xuất (Force Logout/Revoke Session); cấm tính năng Impersonation tự do. Trên trang `/admin/finance`: xây dựng Workbench Đối soát gồm 4 phân hệ (Giao dịch đã khớp, Giao dịch ngoại lệ, Xử lý hoàn tiền, Báo cáo đối soát tải về).
  - **Tiêu chuẩn nghiệm thu:**
    1. Admin có thể khóa tài khoản vi phạm, tài khoản bị khóa bị từ chối truy cập ngay lập tức.
    2. Bàn đối soát tài chính phân loại rõ giao dịch ngoại lệ và cho phép xuất file đối soát doanh thu.
  - **Lệnh kiểm chứng:** `npm test src/features/billing/services/payment-verifier.service.test.ts`
  - **Phụ thuộc:** Task 6.1
  - **Chuyên trách:** Skill: `security-and-hardening`, `frontend-ui-engineering` | Agent: `security-auditor`
  - **Files:** `src/app/(dashboard)/admin/users/page.tsx`, `src/app/(dashboard)/admin/finance/page.tsx`, `src/features/billing/services/payment-verifier.service.ts`
  - **Size:** L (~200 dòng)

- [x] **Task 6.3: Platform Content Studio, Phân Phối Đề & Bàn Thẩm Định Nội Dung 2 Cột**
  - **Mô tả:** Xây dựng Platform Content Studio (`/admin/content`): Admin biên soạn đề chuẩn của NEXA, phát hành vào Shared Catalog hoặc cấp phép (License) riêng cho Org. Nâng cấp khu Kiểm duyệt nội dung đóng góp (`/admin/content-moderation`) thành Workbench 2 cột (cột trái xem trước toàn bộ đề và rubric; cột phải gồm checklist kiểm định chất lượng, ô nhập nhận xét và 3 nút: Phê duyệt / Yêu cầu sửa / Từ chối).
  - **Tiêu chuẩn nghiệm thu:**
    1. Đề thi chuẩn nền tảng có thể cấp quyền cho Org sử dụng mà không cho phép Org sửa đề gốc.
    2. Bàn thẩm định nội dung 2 cột xem trước đầy đủ câu hỏi và rubric trước khi duyệt.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.2
  - **Chuyên trách:** Skill: `frontend-ui-engineering`, `impeccable` | Agent: `code-reviewer`
  - **Files:** `src/app/(dashboard)/admin/content/page.tsx`, `src/app/(dashboard)/admin/content-moderation/page.tsx`
  - **Size:** M (~160 dòng)

- [x] **Task 6.4: Trung Tâm Truyền Thông, Góp Ý Nền Tảng & Phân Quyền 5 Vai Trò Nội Bộ Admin**
  - **Mô tả:** Xây dựng Communications Center (`/admin/communications`): tiếp nhận Hộp thư góp ý (Feedback Inbox) từ người dùng/Org; công cụ gửi thông báo đẩy in-app broadcast; chiến dịch email có đồng ý nhận tin và unsubscribe. Phân chia 5 vai trò Admin nội bộ (`SUPER_ADMIN`, `OPERATIONS_ADMIN`, `CONTENT_ADMIN`, `FINANCE_ADMIN`, `AI_OPERATOR`). Xóa bỏ slider hết hạn phiên giả trên `/admin/settings`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Hộp thư tiếp nhận góp ý từ chân trang Sidebar Personal và Org hoạt động chuẩn.
    2. Admin có thể tạo thông báo in-app broadcast tới toàn bộ người dùng đang đăng nhập.
    3. Trang Settings Admin loại bỏ toàn bộ các slider giao diện giả lập.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 6.1
  - **Chuyên trách:** Skill: `api-and-interface-design`, `security-and-hardening` | Agent: `security-auditor`
  - **Files:** `src/app/(dashboard)/admin/communications/page.tsx`, `src/app/(dashboard)/admin/settings/page.tsx`
  - **Size:** M (~150 dòng)

- [x] **Checkpoint 6: Kiểm Tra Hoàn Tất Platform Control Plane**
  - Chạy `npm run typecheck`
  - Chạy `npm test`

---

## Giai Đoạn 7: Master Verification Suite & Knowledge Graph Sync

- [x] **Task 7.1: Master Verification Suite (Tests, TypeScript strict, Next.js Production Build)**
  - **Mô tả:** Chạy toàn bộ các bài kiểm tra chất lượng từ đầu đến cuối: Vitest unit & integration test suites, TypeScript compilation strict check (`tsc --noEmit`), và Next.js production build (`next build`) trên toàn bộ 86+ routes.
  - **Tiêu chuẩn nghiệm thu:**
    1. 100% test suites pass (30+ test files, 135+ tests).
    2. 0 lỗi TypeScript (`npm run typecheck` exited 0).
    3. Next.js production build hoàn tất thành công (`npm run build` exited 0).
  - **Lệnh kiểm chứng:** `npm test && npm run typecheck && npm run build`
  - **Phụ thuộc:** Checkpoint 1 đến 6
  - **Chuyên trách:** Skill: `test-driven-development` | Agent: `test-engineer`
  - **Files:** Toàn bộ repository
  - **Size:** M (~100 dòng)

- [x] **Task 7.2: Codebase Memory Knowledge Graph Sync (`graphify update .`)**
  - **Mô tả:** Đồng bộ đồ thị tri thức mã nguồn AST của codebase bằng công cụ Graphify theo đúng quy tắc `.agents/rules/graphify.md`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Lệnh `graphify update .` thực thi thành công không lỗi (code 0).
    2. `graphify-out/graph.json` và `GRAPH_REPORT.md` được cập nhật đầy đủ các node, edge và community mới.
  - **Lệnh kiểm chứng:** `graphify update .`
  - **Phụ thuộc:** Task 7.1
  - **Chuyên trách:** Skill: `graphify` | Agent: `test-engineer`
  - **Files:** `graphify-out/*`
  - **Size:** S (~10 dòng)

- [x] **Checkpoint 7: Hoàn Tất Dự Án & Sẵn Sàng Bàn Giao**
  - Xác nhận toàn bộ 15 tasks đã hoàn tất `[x]`.
  - Toàn bộ 3 dashboard đồng bộ, sạch lỗi và sẵn sàng chạy thực tế.
