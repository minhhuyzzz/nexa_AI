# Kế hoạch Triển khai: Đồng Bộ 4 Gói Dịch Vụ Chuẩn Hóa, Kết Nối CSDL Thật & Checkout 0đ Tháng Đầu (Admin & Personal)

## 1. Mục tiêu tổng thể
1. **Xóa bỏ hoàn toàn dữ liệu giả (Mock State) trên Admin Dashboard:**
   - Trang `/admin/plans` (Gói dịch vụ): Bỏ React state mock (chỉ có 3 gói cũ), kết nối trực tiếp bảng `service_plans` với 4 gói dịch vụ chuẩn hóa (`Gói Cơ Bản - 0đ`, `Gói Tiêu Chuẩn - 49.000đ/tháng có 0đ tháng đầu`, `Gói Nâng Cao - 149.000đ/tháng`, `Gói Tổ Chức - B2B`).
   - Trang `/admin/users` (Người dùng): Cập nhật bộ lọc và bảng hiển thị từ enum cũ (`Free`, `Pro`, `Business`) sang 4 gói thật. Cho phép Admin phân quyền và gán gói trực tiếp, tự động cấp bù AI credits và gia hạn 30 ngày.
2. **Triển khai luồng thanh toán Checkout 0 đồng tháng đầu tiên cho Gói Tiêu Chuẩn:**
   - Người dùng đăng ký Gói Tiêu Chuẩn đi qua trang Checkout, tạo giao dịch thật (`amount: 0`, `status: SUCCESS`), kích hoạt 30 ngày dùng thử và 100 AI credits.
   - Cơ chế nhắc thanh toán chu kỳ tiếp theo qua VietQR PayOS 49.000đ (kèm nút "Hủy gia hạn" trong Billing).
3. **Chuẩn hóa SEO từ ngữ & UI/UX theo [AGENTS.md](file:///c:/nexa/AGENTS.md):**
   - Loại bỏ số hiệu `DigComp 2.2` trên UI, dùng "các miền năng lực số", "Khung năng lực số", "Hồ sơ năng lực số".
   - Tuân thủ nghiêm ngặt Zero Horizontal Borders (không `<hr>`, `border-b`, `border-t`, `divide-y`), màu Light trắng (`#FFFFFF`) / Dark đen (`#000000`), xanh Cobalt `#2563EB` cho link/CTA, không dùng emoji trong JSX.

---

## 2. Phân tích phụ thuộc (Dependency Graph)

```
Database Schema & Migrations
  ├── Bảng service_plans: mở rộng trial_days, annual_price_vnd, quotas
  ├── Bảng subscriptions: quản lý vòng đời TRIALING, ACTIVE, auto_renew
  ├── Bảng user_trial_history: chống gian lận dùng thử nhiều lần
  └── Seed/Upsert 4 gói chuẩn hóa: BASIC, STANDARD, ADVANCED, ENTERPRISE
          │
          ▼
Backend Services & APIs
  ├── /api/admin/plans (GET, POST, PATCH)
  ├── /api/admin/users (GET, PATCH với cấp bù AI credits & Audit log)
  ├── /api/billing/create-intent (Đơn hàng 0đ cho trial lần đầu)
  ├── /api/billing/confirm-trial (Kích hoạt 30 ngày dùng thử 0đ)
  └── /api/billing/cancel-auto-renew (Bật/tắt hủy gia hạn kỳ sau)
          │
          ▼
Admin Dashboard UI (Zero Mock, Real DB Binding)
  ├── /admin/plans/page.tsx (Tab B2C 4 gói, Tab B2B tổ chức thật, Modal cấu hình gói)
  └── /admin/users/page.tsx (Filter dropdown 4 gói, Modal gán gói chuẩn hóa)
          │
          ▼
Personal UI & Verification
  ├── /personal/checkout/page.tsx (Đơn hàng 0đ Gói Tiêu Chuẩn, nút kích hoạt)
  ├── /personal/billing/page.tsx (Banner dùng thử còn X ngày, nút Hủy gia hạn)
  └── Test Suites (Vitest + Typecheck)
```

---

## 3. Các nhiệm vụ chi tiết theo 4 lát cắt dọc (Vertical Slicing)

### Lát cắt 1: CSDL & Migration (Foundation)

#### Task 1: Tạo Migration 55 chuẩn hóa bảng `service_plans` và bảng `subscriptions`
- **Mô tả:** Viết file migration `src/database/migrations/55_subscriptions_and_standardized_service_plans.sql` để mở rộng `service_plans` (bổ sung `trial_days`, `annual_price_vnd`, `max_classes`, `max_class_members`, `max_live_participants`), upsert 4 gói chuẩn hóa (`BASIC`, `STANDARD`, `ADVANCED`, `ENTERPRISE`), tạo bảng `subscriptions` và bảng `user_trial_history` kèm RLS policies.
- **Tiêu chuẩn chấp thuận (Acceptance Criteria):**
  - [ ] Migration chứa đầy đủ DDL cho `subscriptions` và `user_trial_history`.
  - [ ] 4 gói dịch vụ được khởi tạo/cập nhật đầy đủ thông số giá, credits, quotas, số ngày trial.
  - [ ] Bảo toàn các alias cũ (`LEARNER_FREE`, `LEARNER_PLUS`, `LEARNER_PRO`, `ORG_CAMPUS`) để tương thích ngược.
  - [ ] Có kèm file rollback tương ứng `55_rollback_subscriptions_and_service_plans.sql`.
- **Kiểm chứng:**
  - [ ] Chạy SQL script kiểm tra cú pháp hợp lệ.
  - [ ] Chạy `npm test` không gây regression.
- **Tập tin liên quan:**
  - `src/database/migrations/55_subscriptions_and_standardized_service_plans.sql`
  - `src/database/migrations/55_rollback_subscriptions_and_service_plans.sql`

---

### Lát cắt 2: Backend APIs (Engine)

#### Task 2: Nâng cấp API Quản trị Gói dịch vụ (`/api/admin/plans`)
- **Mô tả:** Mở rộng `src/app/api/admin/plans/route.ts` để `GET` trả về đầy đủ 4 gói chuẩn hóa cùng các trường cấu hình định mức (`trial_days`, `annual_price_vnd`, `max_classes`, `max_class_members`, `max_live_participants`), và `PATCH` cho phép Platform Admin cập nhật giá, credits, hạn mức lưu trực tiếp vào CSDL.
- **Tiêu chuẩn chấp thuận:**
  - [ ] `GET /api/admin/plans` trả về danh sách 4 gói từ `service_plans` sắp xếp theo `sort_order`.
  - [ ] `PATCH /api/admin/plans` nhận payload và cập nhật CSDL an toàn, kiểm tra quyền `requirePlatformAdmin`.
- **Kiểm chứng:**
  - [ ] Chạy unit test API route.
- **Tập tin liên quan:**
  - `src/app/api/admin/plans/route.ts`

#### Task 3: Nâng cấp API Quản trị Người dùng (`/api/admin/users`)
- **Mô tả:** Nâng cấp `src/app/api/admin/users/route.ts` để trả về tên và mã gói thực tế (4 gói chuẩn hóa). Trong `PATCH`, khi Admin đổi gói người dùng, hệ thống cập nhật `profiles.plan_tier`, tạo bản ghi `subscriptions` mới, tự động cấp bù AI credits tương ứng với gói mới và ghi nhận vào `admin_audit_logs`.
- **Tiêu chuẩn chấp thuận:**
  - [ ] User record trả về đúng `planTier` từ 4 gói (`BASIC`, `STANDARD`, `ADVANCED`, `ENTERPRISE`).
  - [ ] Đổi gói thành công sẽ cập nhật số dư AI credits và gia hạn 30 ngày.
  - [ ] Ghi audit log với action `UPDATE_USER_PLAN`.
- **Kiểm chứng:**
  - [ ] Chạy test `tests/admin/` và typecheck.
- **Tập tin liên quan:**
  - `src/app/api/admin/users/route.ts`

#### Task 4: Xây dựng API Checkout 0đ và Quản lý Gia hạn (`/api/billing/*`)
- **Mô tả:** Cập nhật `src/app/api/billing/create-intent/route.ts`, bổ sung `src/app/api/billing/confirm-trial/route.ts` và `src/app/api/billing/cancel-auto-renew/route.ts`. Cho phép người dùng đăng ký Gói Tiêu Chuẩn lần đầu với giá 0đ, kích hoạt 30 ngày dùng thử và quản lý trạng thái tự động gia hạn.
- **Tiêu chuẩn chấp thuận:**
  - [ ] Nếu user chưa từng dùng thử Gói Tiêu Chuẩn, intent trả về `amount: 0`.
  - [ ] `POST /api/billing/confirm-trial` tạo transaction `amount: 0`, status `SUCCESS`, tạo subscription `TRIALING`, cấp 100 AI credits, ghi `user_trial_history`.
  - [ ] `POST /api/billing/cancel-auto-renew` cập nhật `auto_renew: false` trong subscription.
- **Kiểm chứng:**
  - [ ] Viết test tự động cho luồng trial activation và cancel renewal.
- **Tập tin liên quan:**
  - `src/app/api/billing/create-intent/route.ts`
  - `src/app/api/billing/confirm-trial/route.ts`
  - `src/app/api/billing/cancel-auto-renew/route.ts`
  - `src/app/api/billing/preview/route.ts`

---

### Lát cắt 3: Admin Dashboard UI (Management)

#### Task 5: Tái thiết kế UI Quản trị Gói dịch vụ (`/admin/plans`)
- **Mô tả:** Viết lại toàn diện `src/app/(dashboard)/admin/plans/page.tsx`. Xóa bỏ 100% React state mock. Tab B2C fetch danh sách 4 gói thật từ `/api/admin/plans`. Thêm Modal/Drawer cấu hình gói chuyên nghiệp cho phép Admin sửa giá niêm yết, giá năm, AI credits, số ngày trial, hạn mức nhóm lớp/phòng thi và lưu trực tiếp vào CSDL. Tab B2B hiển thị danh sách tổ chức và yêu cầu từ `/api/admin/organizations`.
- **Tiêu chuẩn chấp thuận:**
  - [ ] Hiển thị 4 thẻ gói dịch vụ chuẩn hóa B2C với dữ liệu thật từ CSDL.
  - [ ] Modal cấu hình gói hoạt động mượt mà, lưu thành công vào CSDL và toast thông báo.
  - [ ] Tab B2B hiển thị dữ liệu tổ chức thật, không có mảng mock `b2bContracts`.
  - [ ] Tuân thủ quy chuẩn Zero Horizontal Borders, Light trắng / Dark đen, không emoji.
- **Kiểm chứng:**
  - [ ] `npx tsc --noEmit` không lỗi.
  - [ ] Kiểm tra giao diện Light và Dark mode.
- **Tập tin liên quan:**
  - `src/app/(dashboard)/admin/plans/page.tsx`

#### Task 6: Nâng cấp UI Quản lý Người dùng (`/admin/users`)
- **Mô tả:** Cập nhật `src/app/(dashboard)/admin/users/page.tsx` để bộ lọc Gói hiển thị 4 tùy chọn chuẩn hóa: `Tất cả`, `Gói Cơ Bản`, `Gói Tiêu Chuẩn`, `Gói Nâng Cao`, `Gói Tổ Chức`. Cột bảng hiển thị đúng tên và badge gói tương ứng. Modal "Phân quyền & Gói" cho phép Admin chọn 1 trong 4 gói thật để nâng/hạ gói người dùng.
- **Tiêu chuẩn chấp thuận:**
  - [ ] Bộ lọc gói hoạt động chính xác trên 4 gói thật.
  - [ ] Modal đổi gói hiển thị 4 gói và cập nhật thành công qua API.
  - [ ] Giao diện chuẩn hóa, không dùng `<hr>`.
- **Kiểm chứng:**
  - [ ] `npx tsc --noEmit` không lỗi.
- **Tập tin liên quan:**
  - `src/app/(dashboard)/admin/users/page.tsx`

---

### Lát cắt 4: Personal UI, Quản lý Thanh toán & Kiểm thử Tích hợp

#### Task 7: Cập nhật Personal Checkout & Billing UI
- **Mô tả:** Cập nhật `src/app/(dashboard)/personal/checkout/page.tsx` để hỗ trợ đơn hàng dùng thử Gói Tiêu Chuẩn: hiển thị giá gốc 49.000đ, ưu đãi tháng đầu -49.000đ, số tiền thanh toán 0đ, nút "Xác nhận đăng ký dùng thử 30 ngày (0đ)". Cập nhật `src/app/(dashboard)/personal/billing/page.tsx` hiển thị banner thời hạn dùng thử ("Đang dùng thử miễn phí - Còn X ngày"), nút "Hủy gia hạn chu kỳ sau", và lịch sử giao dịch 0đ.
- **Tiêu chuẩn chấp thuận:**
  - [ ] Trang Checkout hiển thị đúng 0đ cho người dùng mới đăng ký Gói Tiêu Chuẩn.
  - [ ] Nhấn xác nhận kích hoạt thành công và chuyển hướng đến trang thanh toán thành công / Dashboard.
  - [ ] Trang Billing hiển thị chính xác trạng thái subscription và nút Hủy gia hạn.
- **Kiểm chứng:**
  - [ ] `npx tsc --noEmit` không lỗi.
- **Tập tin liên quan:**
  - `src/app/(dashboard)/personal/checkout/page.tsx`
  - `src/app/(dashboard)/personal/billing/page.tsx`

#### Task 8: Kiểm thử toàn diện & Verification
- **Mô tả:** Viết bài kiểm thử tự động cho luồng đăng ký dùng thử 0đ, luồng cập nhật gói của Admin, chạy toàn bộ test suite hiện có của dự án và xác nhận không có bất kỳ regression nào.
- **Tiêu chuẩn chấp thuận:**
  - [ ] `npx tsc --noEmit` đạt 0 lỗi.
  - [ ] `npm test` vượt qua 100% test files (tối thiểu 96/96 files, >1.527 tests xanh).
- **Tập tin liên quan:**
  - `tests/billing/free-trial-and-admin-plans.test.ts`
