# Danh Sách Công Việc: Chuyển Đổi Không Gian Làm Việc Cá Nhân & Tổ Chức (Hoàn Thành 100%)

## Giai Đoạn 1: Thiết Kế & Chuẩn Hóa Kiến Trúc Đa Tầng (Completed)
- [x] **Task 1.1**: Phân tích đặc tả kỹ thuật `NEXA_AI_PRODUCT_SPEC_PERSONAL_ORGANIZATION_WORKSPACES.md` và tinh chỉnh ý tưởng (`idea-refine`).
- [x] **Task 1.2**: Lập bản kế hoạch triển khai chi tiết (`tasks/plan.md`) với 3 tầng không gian: `/personal/*`, `/org/[slug]/*`, `/admin/*`.
- [x] **Task 1.3**: Thiết kế Migration SQL schema chuẩn hóa `19_personal_org_workspaces_schema.sql` với RLS kép (`personal` vs `organization`).

## Giai Đoạn 2: Xây Dựng 3 Bộ Shell Dashboard Zero-Shared (Completed)
- [x] **Task 2.1**: Thiết kế `PersonalSidebar`, `PersonalTopbar`, `PersonalAvatarMenu` và tích hợp `WorkspaceSwitcher`.
- [x] **Task 2.2**: Thiết kế `OrgSidebar`, `OrgTopbar`, `OrgAvatarMenu` độc lập cho từng tổ chức `/org/[slug]/*`.
- [x] **Task 2.3**: Duy trì `AdminSidebar`, `AdminTopbar`, `AdminAvatarMenu` cho Platform Control Plane `/admin/*`.
- [x] **Task 2.4**: Dọn sạch hoàn toàn các shell cũ `(dashboard)/learner/*` và `(dashboard)/evaluator/*`.

## Giai Đoạn 3: Tích Hợp Đầy Đủ Chức Năng Vào Personal Workspace (Completed)
- [x] **Task 3.1**: Tích hợp trang Dashboard cá nhân `/personal/dashboard` (Streak, Radar 5 Miền, BXH, Bài thi đề xuất).
- [x] **Task 3.2**: Tích hợp công cụ sáng tạo & khảo thí vào `/personal/*`:
  - Soạn đề thi `/personal/assessments/new`
  - Ngân hàng câu hỏi cá nhân `/personal/item-bank`
  - Phòng thi trực tiếp cá nhân `/personal/live-room`
  - Bàn chấm bài thực hành & AI `/personal/grading`
  - Hồ sơ năng lực `/personal/competency`, Đóng góp cộng đồng `/personal/contribute`, Lộ trình `/personal/learning-path`
- [x] **Task 3.3**: Cập nhật các API endpoints phân quyền cá nhân (`/api/assessments`, `/api/question-bank`, `/api/evaluator/*`, `/api/rooms/*`).

## Giai Đoạn 4: Không Gian Làm Việc Tổ Chức `/org/[slug]/*` (Completed)
- [x] **Task 4.1**: Màn hình Tổng quan Tổ chức `/org/[slug]/dashboard` (Thành viên, Bài thi nội bộ, Phòng thi, Phân tích năng lực).
- [x] **Task 4.2**: Quản lý thành viên `/org/[slug]/members` và phân quyền `ORG_ADMIN` / `MEMBER`.
- [x] **Task 4.3**: Quản lý nhóm `/org/[slug]/groups`, Bài thi tổ chức `/org/[slug]/assessments`, Báo cáo `/org/[slug]/analytics`, Cài đặt `/org/[slug]/settings`.

## Giai Đoạn 5: Quản Lý Hạn Mức Gói Dịch Vụ & Bảo Mật (Completed)
- [x] **Task 5.1**: Xây dựng Quota Enforcement Service (`quota-enforcement.service.ts`) kiểm soát giới hạn tạo bài thi, ngân hàng câu hỏi, phòng thi live.
- [x] **Task 5.2**: Viết unit test cho Quota Enforcement Service (`quota-enforcement.service.test.ts`).
- [x] **Task 5.3**: Viết unit test kiểm thử cô lập đa người thuê (`cross-tenant-isolation.test.ts`).

## Giai Đoạn 6: Kiểm Thử Toàn Diện & Type-Safety (Completed)
- [x] **Task 6.1**: Chạy `npx tsc --noEmit` đạt 0 lỗi kiểu dữ liệu.
- [x] **Task 6.2**: Chạy `npm test` vượt qua 100% test cases.
- [x] **Task 6.3**: Cập nhật tài liệu quy tắc dự án `AGENTS.md`.
