# Danh Sách Nhiệm Vụ Triển Khai (Todo List)

## Lát cắt 1: CSDL & Migration (Foundation)
- [x] **Task 1.1:** Viết file migration `src/database/migrations/55_subscriptions_and_standardized_service_plans.sql` mở rộng `service_plans`, tạo bảng `subscriptions` và bảng `user_trial_history`.
- [x] **Task 1.2:** Viết file rollback migration `src/database/migrations/55_rollback_subscriptions_and_service_plans.sql`.
- [x] **Task 1.3:** Cập nhật TypeScript types trong `src/types/database.types.ts` để đồng bộ cấu trúc mới.

## Lát cắt 2: Backend APIs (Engine)
- [x] **Task 2.1:** Nâng cấp `src/app/api/admin/plans/route.ts`: `GET` trả về 4 gói đầy đủ thuộc tính, `PATCH` cho phép Admin chỉnh sửa giá, credits, trial, hạn mức lưu DB.
- [x] **Task 2.2:** Nâng cấp `src/app/api/admin/users/route.ts`: hiển thị đúng 4 gói chuẩn, cập nhật `PATCH` tự động cấp bù AI credits + 30 ngày thời hạn + ghi Audit log.
- [x] **Task 2.3:** Cập nhật `src/app/api/billing/preview/route.ts` xác định tư cách dùng thử 0đ tháng đầu tiên cho Gói Tiêu Chuẩn.
- [x] **Task 2.4:** Tạo endpoint `src/app/api/billing/confirm-trial/route.ts` kích hoạt 30 ngày dùng thử 0đ, lưu transaction `amount: 0`.
- [x] **Task 2.5:** Tạo endpoint `src/app/api/billing/cancel-auto-renew/route.ts` cho phép người dùng hủy gia hạn kỳ tiếp theo.

## Lát cắt 3: Admin Dashboard UI (Management)
- [x] **Task 3.1:** Tái cấu trúc `src/app/(dashboard)/admin/plans/page.tsx`: xóa sạch mock state, load 4 gói thật từ API.
- [x] **Task 3.2:** Xây dựng Modal cấu hình gói trong `admin/plans/page.tsx`: cho phép Admin chỉnh sửa giá tháng, giá năm, credits, số ngày trial, quotas và lưu thẳng DB.
- [x] **Task 3.3:** Nâng cấp tab B2B trong `admin/plans/page.tsx`: hiển thị danh sách tổ chức thật từ API.
- [x] **Task 3.4:** Cập nhật `src/app/(dashboard)/admin/users/page.tsx`: bộ lọc dropdown 4 gói, bảng hiển thị badge 4 gói, modal phân quyền cập nhật gói thật.

## Lát cắt 4: Personal UI, Quản lý Thanh toán & Kiểm thử
- [x] **Task 4.1:** Cập nhật `src/app/(dashboard)/personal/checkout/page.tsx`: hiển thị đơn hàng 0đ cho Gói Tiêu Chuẩn dùng thử lần đầu, nút xác nhận kích hoạt 0đ.
- [x] **Task 4.2:** Cập nhật `src/app/(dashboard)/personal/billing/page.tsx`: hiển thị banner thời hạn dùng thử, nút Hủy gia hạn, bảng biểu phí chuẩn hóa.
- [x] **Task 4.3:** Viết unit & integration tests `tests/billing/free-trial-and-admin-plans.test.ts` (12/12 tests PASS).
- [x] **Task 4.4:** Chạy kiểm thử tự động toàn bộ dự án (`npx tsc --noEmit` & `npm test`) đảm bảo 100% xanh.
