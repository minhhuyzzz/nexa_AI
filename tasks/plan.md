# Kế hoạch Triển khai: Tinh Gọn RBAC 2 Cấp (Platform Owner & Admin), Đăng Nhập Trực Tiếp & Sửa Triệt Để Nhật Ký Kiểm Toán

## 1. Mục tiêu tổng thể
1. **Tinh gọn RBAC Quản trị nền tảng từ 5 vai trò xuống 2 vai trò chuẩn:**
   - **Chủ sở hữu nền tảng (Platform Owner):** Duy nhất 1 tài khoản sáng lập, toàn quyền tối cao, email neo trong server env làm Root of Trust. Là người duy nhất được bổ nhiệm / thu hồi quyền Admin khác và quản trị cài đặt cốt lõi.
   - **Quản trị viên nền tảng (Platform Admin):** Được Owner phân quyền trực tiếp trên giao diện web (bảng `profiles.admin_role = 'ADMIN'`), toàn quyền vận hành (quản lý người dùng, tổ chức, đề thi, giao dịch) nhưng không thể phân quyền hay can thiệp vào tài khoản Owner.
2. **Đăng nhập vào thẳng `/admin/dashboard` & Tách biệt Không gian:**
   - Khi tài khoản có quyền Admin/Owner đăng nhập thành công, hệ thống tự động định tuyến thẳng vào `/admin/dashboard`. Xóa bỏ hoàn toàn đoạn code cũ vốn tự động hạ quyền về `LEARNER` nếu email không có trong `.env`.
   - Tách cổng Admin hệ thống độc lập, không đặt lẫn lộn vào dropdown Chuyển không gian làm việc (Workspace Switcher).
3. **Khắc phục triệt để lỗi hiển thị Nhật ký kiểm toán (`/admin/compliance`) & Hoạt động gần đây (`/admin/dashboard`):**
   - Lưu trữ và hiển thị chính xác Email thật, Tên thật và Địa chỉ IP của Admin thực hiện thao tác thay vì hiển thị `System / Auto`, `Quản trị viên` và `Internal RPC`.
   - Tương thích ngược: tự động đối soát join bảng `profiles` theo `admin_id` để khôi phục danh tính cho toàn bộ 53+ bản ghi kiểm toán lịch sử đã lỡ bị lưu `null`.
4. **Tuân thủ quy chuẩn [AGENTS.md](file:///c:/nexa/AGENTS.md):**
   - Zero horizontal borders (không `<hr>`).
   - Light Mode `#FFFFFF`, Dark Mode `#000000`, Cobalt `#2563EB` cho link/CTA, trung tính `#171717` cho tiêu đề.

---

## 2. Phân tích phụ thuộc (Dependency Graph)

```
Database Schema & Profiles
  └── profiles.admin_role: Chuẩn hóa CHECK constraint ('SUPER_ADMIN' / 'ADMIN' / 'LEARNER')
          │
          ▼
Core Auth & Authorization Guards
  ├── src/lib/auth/superadmin.ts (isPlatformOwner / getPlatformOwnerEmail)
  ├── src/lib/auth/admin-guard.ts (Rút gọn ROLE_PERMISSIONS về OWNER & ADMIN)
  └── src/app/api/auth/login/route.ts (Fix redirectUrl thẳng tới /admin/dashboard)
          │
          ▼
Audit Service & Client Data Binding
  ├── src/lib/audit/admin-audit.service.ts (Auto-resolve profile email, extract request IP)
  ├── src/app/api/admin/audit-logs/route.ts (Fallback join profiles on null email)
  └── Update callers in admin API routes (pass adminEmail & real IP)
          │
          ▼
Admin UI Components & Management
  ├── /admin/compliance/page.tsx (Hiển thị đúng Email, Tên thật, IP thật)
  ├── /admin/dashboard/page.tsx (Hiển thị đúng Người thực hiện trong Hoạt động gần đây)
  ├── /admin/users/page.tsx (Nút bổ nhiệm Admin chỉ dành riêng cho Platform Owner)
  └── src/components/dashboard/WorkspaceSwitcher.tsx (Tách biệt cổng Admin)
```

---

## 3. Các nhiệm vụ chi tiết (Vertical Slices)

### Lát cắt 1: Chuẩn hóa RBAC 2 Cấp & Logic Phân quyền Cốt lõi
- **Task 1.1:** Cập nhật `src/lib/auth/superadmin.ts` và `src/lib/auth/admin-guard.ts`
  - Đặt `isPlatformOwner(email)` làm Root of Trust kiểm tra tài khoản sáng lập tối cao.
  - Rút gọn `ROLE_PERMISSIONS`:
    - `SUPER_ADMIN` (Platform Owner): Có tất cả quyền, bao gồm `MANAGE_ROLES`, `MANAGE_SETTINGS`, `OPERATE_AI`.
    - `ADMIN` (Platform Admin): Có quyền `MANAGE_USERS`, `MANAGE_ORGANIZATIONS`, `MANAGE_CONTENT`, `VIEW_FINANCE`, `MANAGE_FINANCE`.
- **Task 1.2:** Sửa API login `src/app/api/auth/login/route.ts`
  - Bỏ đoạn code cũ demote tài khoản về `LEARNER`.
  - Nếu tài khoản có `profile.admin_role === 'ADMIN'` hoặc là Platform Owner: trả về `redirectUrl: '/admin/dashboard'`.

### Lát cắt 2: Sửa Triệt Để Dịch Vụ Nhật Ký Kiểm Toán (Audit Service)
- **Task 2.1:** Cập nhật `src/lib/audit/admin-audit.service.ts`
  - Nếu caller không truyền `adminEmail`, tự động query bảng `profiles` theo `actorId`/`adminId` để lấy email và gán vào bản ghi audit log.
  - Bổ sung helper trích xuất địa chỉ IP thực từ `request.headers` (`x-forwarded-for` hoặc `x-real-ip`).
- **Task 2.2:** Cập nhật API route `src/app/api/admin/audit-logs/route.ts`
  - Truy vấn kết hợp với bảng `profiles(email, full_name, nickname)` theo `admin_id` khi `admin_email` bị null, đảm bảo toàn bộ lịch sử thao tác trước đây lập tức hiển thị đúng email người thực hiện.
- **Task 2.3:** Bổ sung `adminEmail` và `ipAddress` vào các API route admin trọng yếu
  - `src/app/api/admin/assessments/[id]/route.ts`
  - `src/app/api/admin/assessments/bulk/route.ts`
  - `src/app/api/admin/organizations/approve/route.ts`
  - `src/app/api/admin/settings/route.ts`

### Lát cắt 3: Cập Nhật Giao Diện Báo Cáo & Phân Quyền
- **Task 3.1:** Cập nhật trang Nhật ký kiểm toán `src/app/(dashboard)/admin/compliance/page.tsx`
  - Hiển thị email thật (hoặc fallback tên hiển thị) và địa chỉ IP thực, loại bỏ hoàn toàn chữ `System / Auto` và `Internal RPC`.
- **Task 3.2:** Cập nhật bảng Hoạt động gần đây tại `src/app/(dashboard)/admin/dashboard/page.tsx`
  - Cột "Người thực hiện" hiển thị đúng email hoặc họ tên của Admin thao tác thay vì chữ `Quản trị viên` mặc định.
- **Task 3.3:** Cập nhật trang Quản lý người dùng `src/app/(dashboard)/admin/users/page.tsx`
  - Chỉ hiển thị nút gán/thu hồi quyền `Quản trị viên (ADMIN)` nếu người đang đăng nhập là **Platform Owner**.
  - Không cho phép bất kỳ ai giáng cấp hoặc khóa tài khoản của Platform Owner.
- **Task 3.4:** Chuẩn hóa `src/components/dashboard/WorkspaceSwitcher.tsx`
  - Tách bạch cổng Quản trị nền tảng, không để lẫn vào dropdown chuyển không gian của cá nhân/tổ chức.

### Lát cắt 4: Kiểm Thử & Kiểm Chứng Toàn Diện
- **Task 4.1:** Chạy test kiểm tra RBAC và bảo mật:
  - `npx vitest run src/features/security/`
- **Task 4.2:** Chạy kiểm tra kiểu tĩnh TypeScript:
  - `npx tsc --noEmit`
- **Task 4.3:** Cập nhật đồ thị tri thức mã nguồn:
  - `graphify update .`
