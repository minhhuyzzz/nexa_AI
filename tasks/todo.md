# Danh Sách Nhiệm Vụ: Redesign Toàn Diện Organization Dashboard v4 & Tích Hợp Luồng Member Trong Personal

> **Hướng dẫn:** Đánh dấu `[x]` khi hoàn thành từng tiêu chí. Chạy verification tương ứng sau mỗi task trước khi chuyển sang task kế tiếp.

---

## Phase 1: Chuẩn Hóa Shell, Switcher Menu & Tích Hợp Luồng Member Trong Personal

- [x] **Task 1.1: Chuẩn hóa AvatarWorkspaceSection & Switcher UX**
  - **Mô tả:** Đảm bảo menu chuyển đổi không gian hoạt động chuẩn xác theo ngữ cảnh: khi ở Personal hiển thị "+ Tham gia tổ chức khác", khi ở Org hiển thị "Mời thành viên", loại bỏ hoàn toàn ô inline thô "Mã mời tham gia: [FPT-POLY]".
  - **Acceptance criteria:**
    - [x] Trong `src/components/dashboard/AvatarWorkspaceSection.tsx`: Khi ở cá nhân (`isPersonalActive`), menu hiển thị nút `+ Tham gia tổ chức khác` (mở `JoinOrgModal`).
    - [x] Khi đang ở tổ chức (`currentActiveOrg`), menu hiển thị nút `Mời thành viên` (mở `OrgInviteModal` với 3 tab: Mã mời, Link, Email).
    - [x] Không xuất hiện hộp inline `Mã mời tham gia: [code]` trong flyout menu của switcher.
  - **Verification:**
    - [x] Chạy `npm run typecheck` thành công.
    - [x] Kiểm tra trực quan switcher trên Personal và Org.
  - **Dependencies:** None
  - **Files:** `src/components/dashboard/AvatarWorkspaceSection.tsx`
  - **Scope:** S (1 file)

- [x] **Task 1.2: Nâng cấp OrgAssignmentsWidget & Tích hợp Submissions trong Personal**
  - **Mô tả:** Tối ưu hóa trải nghiệm của Thành viên tổ chức trong không gian Personal; hiển thị các bài khảo thí và bài tập được giao từ tổ chức với giao diện chuyên nghiệp, thời hạn và nút 1-click CTA "Bắt đầu làm bài".
  - **Acceptance criteria:**
    - [x] `OrgAssignmentsWidget.tsx` hiển thị huy hiệu tổ chức (`[Building2] Tên tổ chức`), thời hạn nộp bài rõ ràng dạng `DD/MM/YYYY`, và CTA làm bài.
    - [x] Trang `/personal/submissions` truy vấn và hiển thị đồng bộ cả bài tập thường (`class_assignments`) lẫn bài thi chiến dịch (`assessment_campaigns`).
  - **Verification:**
    - [x] Chạy `npm test src/app/\(dashboard\)/personal/` (nếu có test) hoặc `npm run typecheck`.
  - **Dependencies:** Task 1.1
  - **Files:** `src/components/dashboard/personal/OrgAssignmentsWidget.tsx`, `src/app/(dashboard)/personal/submissions/page.tsx`, `src/app/api/personal/organization-work/route.ts`
  - **Scope:** S (2-3 files)

- [x] **Task 1.3: Bộ thành phần dùng chung (Shared Primitives) cho Org Console**
  - **Mô tả:** Chuẩn hóa các primitive Drawer và Modal phục vụ cho 9 màn hình của Org Console (`OrgDrawer`, `OrgFilterBar`, `OrgEmptyState`) đảm bảo tuân thủ WCAG AA, phím Escape, focus ring, và thời gian animation 150-180ms.
  - **Acceptance criteria:**
    - [x] Các primitive hỗ trợ trọn vẹn cả Light mode (`#FFFFFF`) và Dark mode (`#000000`, card `#111114`).
    - [x] Có thể đóng bằng phím `Escape` hoặc click outside.
  - **Verification:**
    - [x] Chạy `npm run typecheck`.
  - **Dependencies:** None
  - **Files:** `src/components/dashboard/org/org-ui/OrgDrawer.tsx`, `src/components/dashboard/org/org-ui/OrgEmptyState.tsx`, `src/components/dashboard/org/org-ui/OrgFilterBar.tsx`
  - **Scope:** S (2-3 files)

### Checkpoint 1: Sau Phase 1
- [x] Tất cả kiểm tra typecheck không có lỗi (`npm run typecheck`).
- [x] Trải nghiệm chuyển đổi không gian Switcher chuẩn xác, không còn ô inline thô kệch.
- [x] Thành viên tổ chức xem bài tập và chiến dịch khảo thí mượt mà ngay trong Personal.

---

## Phase 2: Màn Hình Vận Hành Trọng Tâm: Tổng Quan, Thành Viên, Lớp & Nhóm (Screens 1, 2, 3)

- [x] **Task 2.1: Redesign Màn 1 — Tổng quan (`/org/[slug]`)**
  - **Mô tả:** Nâng cấp trang chủ điều hành Org: sử dụng banner editorial `Banner Tổng quan.jpg`, thay thế 4 hộp KPI to bằng dòng tóm tắt thông số thanh lịch, thêm danh sách việc cần xử lý (Attention Queue) và hiển thị bảng đợt đánh giá thực tế.
  - **Acceptance criteria:**
    - [x] Sử dụng `next/image` tải `Banner Tổng quan.jpg` (với fallback nền `#17213a`).
    - [x] Dòng tóm tắt nhanh hiển thị rõ ràng: `X thành viên · Y nhóm · Z đợt đánh giá · W bài chờ chấm`.
    - [x] Danh sách việc cần chú ý hiển thị số bài nộp đang chờ chấm và đợt thi sắp kết thúc.
    - [x] Không có các thẻ gradient nhiều màu hay hiệu ứng AI slop.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/page.tsx`
  - **Scope:** M (1-2 files)

- [x] **Task 2.2: Redesign Màn 2 — Quản trị Thành viên (`/org/[slug]/members`)**
  - **Mô tả:** Tái cấu trúc trang thành viên: thêm dải xử lý yêu cầu gia nhập qua mã PIN/mã trường ở trên cùng, thanh công cụ tìm kiếm và lọc vai trò, bảng thành viên chuẩn xác và `MemberProfileDrawer` xem chi tiết.
  - **Acceptance criteria:**
    - [x] Dải "Chờ duyệt gia nhập" nổi bật ở trên cùng kèm nút duyệt/từ chối 1-click.
    - [x] Bảng thành viên có phân trang, bộ lọc vai trò (`ORG_ADMIN`, `MEMBER`), bộ lọc theo lớp.
    - [x] Bấm vào dòng thành viên mở `MemberProfileDrawer` hiển thị thông tin chi tiết và hành động thay đổi quyền/gỡ thành viên.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/members/page.tsx`, `src/app/(dashboard)/org/[slug]/members/OrgMembersClientView.tsx`
  - **Scope:** M (2-3 files)

- [x] **Task 2.3: Redesign Màn 3 — Nhóm & Đơn vị Trực Thuộc (`/org/[slug]/classes`)**
  - **Mô tả:** Thiết kế lại màn hình quản lý lớp/đơn vị dưới dạng lưới thư mục trực quan (`classes-grid`), loại bỏ số liệu giả, hỗ trợ tạo lớp mới nhanh và gán đợt đánh giá cho lớp.
  - **Acceptance criteria:**
    - [x] Hiển thị lưới card lớp học trực quan với thông tin giảng viên phụ trách, số lượng thành viên, và đợt thi được giao.
    - [x] Modal tạo lớp học mới và tính năng gán nhanh đợt khảo thí hoạt động trơn tru.
    - [x] Triệt tiêu dữ liệu mock và các số liệu giả lập.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/classes/page.tsx`, `src/components/dashboard/org/classes/OrgClassesDashboardClient.tsx`
  - **Scope:** M (2-3 files)

### Checkpoint 2: Sau Phase 2
- [x] Chạy `npm run typecheck` vượt qua 100%.
- [x] Màn 1, 2, 3 hoàn thành giao diện tinh gọn, hỗ trợ đầy đủ cả Light và Dark mode.

---

## Phase 3: Ngân Hàng Đề, Chiến Dịch & Bàn Chấm Bài 3 Cột (Screens 4, 5, 6)

- [x] **Task 3.1: Redesign Màn 4 — Thư viện Đề Đánh Giá (`/org/[slug]/assessments`)**
  - **Mô tả:** Cập nhật trang thư viện đề: tích hợp hình ảnh `Banner Thư viện đề đánh giá.jpg`, phân chia đề chuẩn DigComp và đề nội bộ tổ chức, bổ sung nút trọng tâm "Tạo đợt từ đề này".
  - **Acceptance criteria:**
    - [x] Banner hình ảnh hiển thị sắc nét bằng `next/image`.
    - [x] Danh sách đề phân loại rõ ràng (Chuẩn DigComp vs Nội bộ).
    - [x] Nút CTA "Tạo đợt từ đề" chuyển tiếp sang trang tạo campaign kèm ID đề.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/assessments/page.tsx`
  - **Scope:** S (1-2 files)

- [x] **Task 3.2: Redesign Màn 5 — Đợt Đánh Giá & Khảo Thí (`/org/[slug]/campaigns`)**
  - **Mô tả:** Xây dựng bảng 3 trạng thái cho đợt khảo thí (Đang diễn ra, Sắp diễn ra, Đã kết thúc), thẻ tiến độ vận hành có thanh phần trăm hoàn thành, và wizard tạo đợt thi với tên tùy chỉnh do Admin đặt (không tự gán Kỳ 1/Kỳ 2).
  - **Acceptance criteria:**
    - [x] 3 tab/bảng trạng thái rõ ràng, chuyển đổi tức thì.
    - [x] Thẻ tiến độ hiển thị số bài nộp / tổng số thành viên kèm thanh progress tinh gọn.
    - [x] Wizard tạo đợt thi cho phép chọn đề, nhập tên riêng, chọn lớp tham gia và thời hạn.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/campaigns/page.tsx`, `src/app/(dashboard)/org/[slug]/campaigns/OrgCampaignsClientView.tsx`
  - **Scope:** M (2-3 files)

- [x] **Task 3.3: Redesign Màn 6 — Bàn Chấm Bài 3 Cột (`/org/[slug]/grading`)**
  - **Mô tả:** Thay thế hoàn toàn modal popup bằng Bàn chấm bài 3 cột chuyên nghiệp: Cột 1 = Hàng đợi bài nộp, Cột 2 = Trình đọc minh chứng / bài làm, Cột 3 = Bảng điểm Rubric chấm theo tiêu chí /100, AI gợi ý và duyệt điểm.
  - **Acceptance criteria:**
    - [x] Bố cục 3 cột (Queue - Document Preview - Rubric Scoring) responsive, không tràn màn hình.
    - [x] Chấm điểm theo thang /100; hỗ trợ AI gợi ý điểm kèm trích dẫn minh chứng.
    - [x] Phê duyệt điểm thành công cập nhật trạng thái bài nộp sang `EVALUATED` và ghi nhận điểm số.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/page.tsx`, `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`
  - **Scope:** M (2 files)

### Checkpoint 3: Sau Phase 3
- [x] Chạy `npm run typecheck` đạt 0 lỗi.
- [x] Bàn chấm bài 3 cột hoạt động trơn tru, không còn phụ thuộc vào modal rời rạc.

---

## Phase 4: Báo Cáo Năng Lực, Gói Dịch Vụ & Cài Đặt (Screens 7, 8, 9)

- [x] **Task 4.1: Redesign Màn 7 — Báo Cáo Năng Lực Tổ Chức (`/org/[slug]/analytics`)**
  - **Mô tả:** Tối ưu hóa trang phân tích năng lực: đồng bộ bộ lọc đợt thi & lớp qua URL searchParams, hiển thị phân bố điểm số theo khoảng, bảng 5 miền DigComp có drawer xem chi tiết, và xuất CSV chuẩn UTF-8 BOM.
  - **Acceptance criteria:**
    - [x] URL lưu trữ `campaignId` và `classId`; có thể copy link chia sẻ trực tiếp.
    - [x] Hiển thị biểu đồ/thanh phân bố điểm số (`<50`, `50-69`, `70-84`, `85-100`).
    - [x] 5 miền DigComp hiển thị điểm trung bình /100; khi chưa có dữ liệu hiển thị `—` hoặc empty state có hướng dẫn.
    - [x] Xuất file CSV báo cáo không bị lỗi font tiếng Việt (UTF-8 BOM).
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/analytics/page.tsx`, `src/features/analytics/components/OrgAnalyticsDashboard.tsx`
  - **Scope:** M (2-3 files)

- [x] **Task 4.2: Redesign Màn 8 — Gói Sử Dụng & Hạn Mức (`/org/[slug]/plan`)**
  - **Mô tả:** Cập nhật trang gói dịch vụ: tích hợp banner `nexa-07-goi-su-dung.png`, dải đồng hồ đo hạn mức (ghế thành viên, credits AI, đề nội bộ), và modal gửi yêu cầu gia hạn gói với ngày cộng dồn an toàn.
  - **Acceptance criteria:**
    - [x] Banner gói hiển thị chuẩn bằng `next/image`.
    - [x] 3 thanh đo hạn mức hiển thị số lượng thực tế / hạn mức cho phép.
    - [x] Modal gia hạn gửi yêu cầu thành công và thông báo quản trị viên chờ duyệt.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/plan/page.tsx`, `src/components/dashboard/org/plan/OrgPlanClientView.tsx`
  - **Scope:** S (2 files)

- [x] **Task 4.3: Redesign Màn 9 — Cài Đặt Tổ Chức (`/org/[slug]/settings`)**
  - **Mô tả:** Xây dựng cấu trúc cài đặt 2 cột dọc hiện đại (Menu danh mục bên trái, Form thiết lập bên phải), bổ sung toggle cơ chế tham gia bằng mã PIN và phê duyệt tự động, kèm cảnh báo dirty state.
  - **Acceptance criteria:**
    - [x] Bố cục 2 cột dọc rõ ràng: Thông tin chung, Cơ chế gia nhập & Bảo mật, Nhận diện tổ chức.
    - [x] Bật/tắt được mã tham gia và yêu cầu phê duyệt thành viên mới.
    - [x] Dirty state cảnh báo người dùng khi có thay đổi chưa lưu.
  - **Verification:**
    - [x] Chạy `npm run typecheck` (0 errors).
  - **Dependencies:** Task 1.3
  - **Files:** `src/app/(dashboard)/org/[slug]/settings/page.tsx`, `src/components/dashboard/org/OrgSettingsView.tsx`
  - **Scope:** S (2 files)

### Checkpoint 4: Sau Phase 4
- [x] Chạy `npm run typecheck` đạt 0 lỗi.
- [x] Toàn bộ 9 màn hình của Organization Dashboard đã được triển khai hoàn chỉnh.

---

## Phase 5: Kiểm Thử Toàn Diện, Tương Phản WCAG & Nghiệm Thu

- [x] **Task 5.1: Kiểm tra tương thích giao diện Light Mode & Dark Mode**
  - **Mô tả:** Rà soát toàn bộ 9 màn hình và không gian Personal trên cả 2 theme Light (`#FFFFFF`) và Dark (`#000000`, card `#111114`). Đảm bảo độ tương phản chữ WCAG AA (tối thiểu 4.5:1), không bị lỗi chữ đen trên nền đen hay chữ trắng trên nền trắng.
  - **Acceptance criteria:**
    - [x] Kiểm tra tất cả các thành phần: sidebar, topbar, bảng, modal, drawer, form, tooltip.
    - [x] Không có text khó đọc hoặc thiếu token theme.
  - **Verification:**
    - [x] Đã chuẩn hóa toàn bộ token theme Light/Dark và kiểm tra visual audit.
  - **Dependencies:** Tasks 2.1 - 4.3
  - **Files:** Toàn bộ components của Org & Personal
  - **Scope:** M (audit)

- [x] **Task 5.2: Verification Suite: Typecheck & Automated Tests**
  - **Mô tả:** Chạy toàn bộ hệ thống kiểm thử tự động và kiểm tra kiểu dữ liệu để đảm bảo không có bất kỳ lỗi biên dịch hay lỗi hồi quy nào.
  - **Acceptance criteria:**
    - [x] `npm run typecheck` hoàn thành với 0 lỗi (Exit Code 0).
    - [x] Toàn bộ test suites `npm test` vượt qua 100% (47/47 files, 271/271 tests).
  - **Verification:**
    - [x] Chạy `npm run typecheck` và `npm test` thành công mỹ mãn.
  - **Dependencies:** All previous tasks
  - **Files:** All test files
  - **Scope:** S (test runner)

### Final Checkpoint: Nghiệm Thu Sản Phẩm
- [x] 9 màn hình Organization Console được tối ưu hóa toàn diện theo Spec V4.
- [x] Luồng thành viên tổ chức hiển thị bài thi và lớp học sắc nét trong Personal.
- [x] Không còn ô inline thô kệch trong Workspace Switcher.
- [x] 100% tests pass và TypeScript check 0 lỗi.
