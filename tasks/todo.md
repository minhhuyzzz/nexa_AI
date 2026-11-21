# Danh Sách Nhiệm Vụ: Tách Biệt Phân Quyền Quản Trị, Ẩn Ban Quản Trị Khỏi Trang Người Dùng & Chuẩn Hóa Nhật Ký Kiểm Toán

- [x] **Phase 1: Xây Dựng Trang & API Quản Trị Viên & Phân Quyền (`/admin/roles`)**
  - [x] Task 1: Tạo API `src/app/api/admin/roles/route.ts` (GET danh sách Super Admin + Admin, POST gán Admin qua email, DELETE thu hồi quyền Admin, ghi log audit)
  - [x] Task 2: Xây dựng Giao diện Trang `src/app/(dashboard)/admin/roles/page.tsx` (Khối Chủ nền tảng bất biến + Khối Quản trị viên thao tác, Modal Thêm Admin, tuân thủ AGENTS.md)
  - [x] Task 3: Cập nhật Sidebar `src/components/dashboard/admin/AdminSidebar.tsx` (Thêm menu `/admin/roles`, ẩn menu nhạy cảm với Admin thường)

- [x] **Phase 2: Lọc Ẩn Ban Quản Trị Khỏi Danh Sách Người Dùng (`/admin/users`)**
  - [x] Task 4: Cập nhật API `src/app/api/admin/users/route.ts` (Loại trừ toàn bộ Super Admin và Admin khỏi danh sách người dùng)
  - [x] Task 5: Tinh gọn giao diện `src/app/(dashboard)/admin/users/page.tsx` (Gỡ bỏ modal/dropdown phân quyền Admin, thuần hóa cho học viên/khách hàng)

- [x] **Phase 3: Khóa Độc Quyền Nhật Ký Kiểm Toán & Chuẩn Hóa Thống Kê**
  - [x] Task 6: Cập nhật `src/lib/auth/admin-guard.ts` và `src/middleware.ts` (Khóa quyền truy cập `/admin/compliance` và `/api/admin/audit-logs` chỉ dành riêng cho Super Admin)
  - [x] Task 7: Cập nhật API `src/app/api/admin/audit-logs/route.ts` và UI `src/app/(dashboard)/admin/compliance/page.tsx` (Hiển thị rõ "X trên tổng số Y Chủ nền tảng đã thao tác")

- [x] **Phase 4: Kiểm Thử & Kiểm Chứng Toàn Diện**
  - [x] Task 8: Bổ sung Test Cases tự động cho phân quyền roles và lọc người dùng trong `src/features/security/admin-security-and-rbac.test.ts`
  - [x] Task 9: Chạy toàn bộ Test Suite (`npx vitest run`), Lint (`npm run lint`) và Typecheck (`npx tsc --noEmit`)
