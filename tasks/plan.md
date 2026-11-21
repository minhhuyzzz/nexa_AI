# Kế hoạch Triển khai: Tách Biệt Trang Quản Trị Viên & Phân Quyền (/admin/roles), Lọc Ẩn Ban Quản Trị Khỏi Trang Người Dùng, Khóa Độc Quyền Nhật Ký Kiểm Toán & Chuẩn Hóa Số Liệu

## 1. Mục tiêu tổng thể
1. **Tách biệt hoàn toàn Quản lý Phân quyền Quản trị viên (`/admin/roles`):**
   - Xây dựng trang riêng "Quản trị viên & Phân quyền" dưới nhóm "Hệ thống và bảo mật" trên Sidebar.
   - Phân định rõ 2 khối:
     + **Chủ nền tảng (Super Admin):** Nguồn từ file cấu hình `.env`, toàn quyền tối cao, bất biến qua giao diện để bảo vệ hạ tầng.
     + **Quản trị viên hệ thống (Admin):** Quản lý qua cơ sở dữ liệu (`profiles.admin_role = 'ADMIN'`), cung cấp chức năng Thêm Quản trị viên qua email và Thu hồi quyền Admin.
2. **Lọc và ẩn 100% Ban quản trị khỏi trang Người dùng (`/admin/users`):**
   - Loại trừ toàn bộ tài khoản Super Admin và Admin khỏi danh sách của `/api/admin/users`.
   - Trang `/admin/users` trở thành trang chuyên biệt chỉ quản lý khách hàng, học viên và tổ chức.
   - Gỡ bỏ modal/dropdown phân quyền Admin rải rác ở trang Người dùng để tập trung 100% vào trang `/admin/roles`.
3. **Thực thi phân quyền RBAC nghiêm ngặt:**
   - **Chủ nền tảng (Super Admin):** Độc quyền truy cập `/admin/compliance` (Nhật ký kiểm toán), `/admin/roles` (Phân quyền Admin), `/admin/ai-gateway` (Cổng kết nối AI) và `/admin/settings` (Cài đặt nền tảng).
   - **Quản trị viên (Admin):** Chỉ quản lý các nghiệp vụ vận hành thông thường (người dùng, tổ chức, đề thi, gói cước). Bị chặn (403 / ẩn menu) khi cố truy cập 4 phân hệ nhạy cảm trên.
4. **Chuẩn hóa hiển thị thẻ thống kê Quản trị viên trong Nhật ký kiểm toán (`/admin/compliance`):**
   - Hiển thị rõ số quản trị viên đã phát sinh thao tác ghi log kèm tổng số Chủ nền tảng hiện có (ví dụ: `5 trên tổng số 7 Chủ nền tảng đã thao tác`).

---

## 2. Phân tích phụ thuộc (Dependency Graph)

```
Config & Environment
  └── src/lib/auth/superadmin.ts (getSuperadminEmails / isSuperadminEmail)
          │
          ▼
RBAC Core Guards & API Authorization
  ├── src/lib/auth/admin-guard.ts (Khóa quyền SUPER_ADMIN cho compliance, roles, settings, ai-gateway)
  └── src/middleware.ts (Chặn route /admin/compliance & /admin/roles đối với Admin thường)
          │
          ▼
Backend API Endpoints
  ├── src/app/api/admin/roles/route.ts (GET danh sách Super Admin + Admin, POST gán Admin, DELETE gỡ Admin)
  ├── src/app/api/admin/users/route.ts (Lọc bỏ Super Admin & Admin khỏi danh sách người dùng)
  └── src/app/api/admin/audit-logs/route.ts (Trả về activeAdmins và totalSuperAdmins)
          │
          ▼
Frontend UI Components
  ├── src/app/(dashboard)/admin/roles/page.tsx (Trang Quản trị viên & Phân quyền chuẩn AGENTS.md)
  ├── src/app/(dashboard)/admin/users/page.tsx (Lược bỏ modal phân quyền Admin, thuần hóa cho học viên)
  ├── src/app/(dashboard)/admin/compliance/page.tsx (Cập nhật nhãn & phụ đề thẻ Quản trị viên thao tác)
  └── src/components/dashboard/admin/AdminSidebar.tsx (Thêm menu /admin/roles, ẩn menu nhạy cảm với Admin thường)
```

---

## 3. Các giai đoạn triển khai chi tiết

### Phase 1: Xây Dựng Trang & API Quản Trị Viên & Phân Quyền (`/admin/roles`)
- **Task 1: Tạo API Quản lý Roles `src/app/api/admin/roles/route.ts`**
  - `GET`: Trả về danh sách Super Admins (từ env) và danh sách Admins (từ `profiles` có `admin_role = 'ADMIN'`).
  - `POST`: Thêm Admin mới qua email (chỉ Super Admin mới được gọi).
  - `DELETE`: Thu hồi quyền Admin (chỉ Super Admin mới được gọi, chặn thu hồi Super Admin).
- **Task 2: Xây dựng Giao diện Trang `src/app/(dashboard)/admin/roles/page.tsx`**
  - Thiết kế bảng phân nhóm: Khối Chủ nền tảng (Super Admin) và Khối Quản trị viên hệ thống (Admin).
  - Modal thêm Admin mới qua email và dialog xác nhận thu hồi quyền.
  - Tuân thủ quy chuẩn giao diện [AGENTS.md](file:///c:/nexa/AGENTS.md): Light `#FFFFFF`, Dark `#000000`, không `<hr>`.
- **Task 3: Cập nhật Sidebar `src/components/dashboard/admin/AdminSidebar.tsx`**
  - Thêm mục "Quản trị viên & Phân quyền" (`/admin/roles`) vào nhóm "Hệ thống và bảo mật".
  - Ẩn các mục nhạy cảm (`/admin/roles`, `/admin/compliance`) nếu người dùng không phải Super Admin.

### Phase 2: Lọc Ẩn Ban Quản Trị Khỏi Danh Sách Người Dùng (`/admin/users`)
- **Task 4: Cập nhật API `src/app/api/admin/users/route.ts`**
  - Lọc loại trừ tất cả tài khoản thuộc `getSuperadminEmails()` hoặc có `admin_role === 'ADMIN' | 'SUPER_ADMIN'`.
  - Đảm bảo danh sách chỉ chứa khách hàng, học viên cá nhân và tổ chức.
- **Task 5: Tinh gọn giao diện `src/app/(dashboard)/admin/users/page.tsx`**
  - Gỡ bỏ modal phân quyền Admin cũ và nút gán quyền Admin khỏi bảng người dùng.
  - Đơn giản hóa hiển thị vai trò (học viên/người dùng).

### Phase 3: Khóa Độc Quyền Nhật Ký Kiểm Toán & Chuẩn Hóa Số Liệu
- **Task 6: Cập nhật Phân Quyền Bảo Mật (`admin-guard.ts` & `middleware.ts`)**
  - Yêu cầu quyền `SUPER_ADMIN` cho API `/api/admin/audit-logs` và route `/admin/compliance`.
- **Task 7: Chuẩn hóa thẻ thống kê trên trang Nhật ký kiểm toán**
  - `api/admin/audit-logs`: Trả về `totalSuperAdmins` cùng `activeAdmins`.
  - `admin/compliance/page.tsx`: Cập nhật thẻ thành "Quản trị viên có hoạt động", hiển thị `X trên tổng số Y Chủ nền tảng đã thao tác`.

### Phase 4: Kiểm Thử & Kiểm Chứng Toàn Diện
- **Task 8: Bổ sung Test Cases Tự Động**
  - Kiểm thử phân quyền API `/api/admin/roles` và loại trừ người dùng trong `/api/admin/users`.
- **Task 9: Kiểm tra Chất lượng Toàn Bộ Hệ Thống**
  - Chạy `npx vitest run` kiểm tra toàn bộ 97+ test suite.
  - Chạy `npm run lint` và `npx tsc --noEmit`.
