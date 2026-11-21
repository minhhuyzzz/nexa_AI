# Danh Sách Nhiệm Vụ: Tinh Gọn RBAC 2 Cấp & Sửa Nhật Ký Kiểm Toán

- [x] **Lát cắt 1: Chuẩn hóa RBAC 2 Cấp & Logic Phân quyền Cốt lõi**
  - [x] Task 1.1: Cập nhật `src/lib/auth/superadmin.ts` và `src/lib/auth/admin-guard.ts` (rút gọn về Platform Owner và Platform Admin, thêm bí danh isPlatformOwner)
  - [x] Task 1.2: Sửa API `src/app/api/auth/login/route.ts` (chuyển hướng thẳng tới `/admin/dashboard` cho Admin/Owner, bỏ demote về LEARNER, set cookie admin)

- [x] **Lát cắt 2: Sửa Triệt Để Dịch Vụ Nhật Ký Kiểm Toán & Khôi Phục Lịch Sử**
  - [x] Task 2.1: Cập nhật `src/lib/audit/admin-audit.service.ts` và tạo `src/lib/audit/client-ip.ts` (tự động tra cứu email từ profiles, helper trích xuất IP thực an toàn)
  - [x] Task 2.2: Cập nhật `src/app/api/admin/audit-logs/route.ts` (join profiles để sửa toàn bộ log cũ bị null email và null IP)
  - [x] Task 2.3: Truyền `adminEmail` và `ipAddress` trong các API admin trọng yếu (`assessments/[id]`, `bulk`, `users`, `settings`)

- [x] **Lát cắt 3: Cập Nhật Giao Diện Báo Cáo & Phân Quyền UI**
  - [x] Task 3.1: Cập nhật `src/app/(dashboard)/admin/compliance/page.tsx` (loại bỏ `System / Auto` và `Internal RPC`, hiển thị email/IP thật)
  - [x] Task 3.2: Cập nhật `src/app/(dashboard)/admin/dashboard/page.tsx` (cột Người thực hiện hiển thị đúng danh tính Admin qua join profiles)
  - [x] Task 3.3: Cập nhật `src/app/(dashboard)/admin/users/page.tsx` (giao diện thăng/giáng quyền Admin chỉ dành riêng cho Platform Owner, bảo vệ tài khoản Owner bất khả xâm phạm)
  - [x] Task 3.4: Chuẩn hóa `src/components/dashboard/WorkspaceSwitcher.tsx` (tách biệt hoàn toàn cổng Admin khỏi dropdown chuyển không gian cá nhân/tổ chức)

- [x] **Lát cắt 4: Kiểm Thử Tự Động & Kiểm Chứng**
  - [x] Task 4.1: Chạy `npx vitest run src/features/security/` (14/14 passed)
  - [x] Task 4.2: Chạy full test suite `npm test` (97/97 test files passed, 1542/1542 tests passed)
  - [x] Task 4.3: Chạy `npx tsc --noEmit` (0 errors)
  - [x] Task 4.4: Chạy `graphify update .`
