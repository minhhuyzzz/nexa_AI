# Danh Sách Nhiệm Vụ: Tái Cấu Trúc Toàn Diện Phân Hệ Quản Trị Hệ Thống (Settings, Audit Logs & AI Gateway)

## Giai đoạn 1: Cài đặt nền tảng (`/admin/settings`)
- [x] **Task 1.1: Cập nhật API `/api/admin/settings` và dịch vụ đọc điểm thưởng**
  - **Mô tả:** Mở rộng schema `updateSettingsSchema` lưu các giá trị: `dailyLoginPts`, `streakMilestonePts`, `contributionApprovedPts`, `maintenanceMode`, `systemTimezone`, `dateTimeFormat`, `platformName`, `supportEmail`. Đồng bộ đọc `dailyLoginPts` trong `src/app/api/personal/profile-stats/route.ts`.
  - **Tiêu chuẩn nghiệm thu:** API GET trả về đúng các trường này; API POST cập nhật thành công vào `system_settings` và ghi nhật ký kiểm toán.
  - **Tệp liên quan:** `src/app/api/admin/settings/route.ts`, `src/app/api/personal/profile-stats/route.ts`

- [x] **Task 1.2: Tái thiết kế giao diện trang Cài đặt nền tảng (`/admin/settings`)**
  - **Mô tả:** Viết lại `src/app/(dashboard)/admin/settings/page.tsx` thành 3 khối Card SaaS: (1) Vận hành & Bảo trì hệ thống, (2) Chính sách điểm thưởng & Chuyên cần (PTS), (3) Múi giờ & Định dạng hiển thị toàn sàn. Loại bỏ hoàn toàn upload size, session timeout, ngưỡng 70%, toggle kiểm duyệt đề thừa.
  - **Tiêu chuẩn nghiệm thu:** Giao diện chuẩn Light/Dark, không đường viền ngang, nạp dữ liệu từ backend và lưu thành công.
  - **Tệp liên quan:** `src/app/(dashboard)/admin/settings/page.tsx`

## Giai đoạn 2: Nhật ký kiểm toán Admin (`/admin/compliance`)
- [x] **Task 2.1: Nâng cấp API `/api/admin/audit-logs`**
  - **Mô tả:** Bổ sung tham số tìm kiếm `search` (theo email admin, action, target_id), lọc theo `period` (`24h`, `7d`, `30d`, `all`), và trả về số liệu tổng quan (tổng thao tác, thao tác 24h, số admin).
  - **Tiêu chuẩn nghiệm thu:** API trả về đúng dữ liệu từ bảng `admin_audit_logs` có sắp xếp thời gian mới nhất.
  - **Tệp liên quan:** `src/app/api/admin/audit-logs/route.ts`

- [x] **Task 2.2: Tái thiết kế giao diện trang Nhật ký kiểm toán (`/admin/compliance`)**
  - **Mô tả:** Viết lại `src/app/(dashboard)/admin/compliance/page.tsx` hiển thị đúng Admin Audit Trail: Thanh thống kê, bộ lọc hành động / đối tượng / thời gian, bảng truy vết chi tiết từng thao tác quản trị (Thời gian, Admin, Hành động, Target, Payload JSON diff, IP). Xóa sạch toàn bộ nội dung Nghị định 13 và proctoring lạc đề.
  - **Tiêu chuẩn nghiệm thu:** Trang hiển thị dữ liệu kiểm toán thật, hỗ trợ tìm kiếm và xem chi tiết payload JSON.
  - **Tệp liên quan:** `src/app/(dashboard)/admin/compliance/page.tsx`

## Giai đoạn 3: Tinh giản Cổng kết nối AI (`/admin/ai-gateway`)
- [x] **Task 3.1: Tinh chỉnh API `/api/admin/ai-gateway`**
  - **Mô tả:** Đơn giản hóa API POST/GET để lưu và đọc cấu hình Provider chung (Gemini, OpenAI, DeepSeek, Claude), Model name, và optional API key. Tiếp tục tính toán 4 chỉ số KPI thực tế từ `ai_usage_events`.
  - **Tiêu chuẩn nghiệm thu:** API xử lý mượt mà, lưu cấu hình vào `system_settings` và trả về danh sách sự kiện gọi AI gần nhất.
  - **Tệp liên quan:** `src/app/api/admin/ai-gateway/route.ts`

- [x] **Task 3.2: Tái thiết kế giao diện trang Cổng kết nối AI (`/admin/ai-gateway`)**
  - **Mô tả:** Viết lại `src/app/(dashboard)/admin/ai-gateway/page.tsx`: 4 thẻ KPI cốt lõi đo lường từ dữ liệu thực (Lượt gọi, Tokens, Độ trễ TB, Tỷ lệ thành công), Khối cấu hình Provider/Model toàn sàn linh hoạt (chọn Gemini, ChatGPT, DeepSeek, Claude + ô nhập Model + ô nhập API Key ngoài tùy chọn), và Bảng Telemetry Logs thực tế từ `ai_usage_events`. Loại bỏ 6 thẻ KPI rườm rà, biểu đồ chi phí USD/VND vo, và việc chia nhỏ 3 nghiệp vụ.
  - **Tiêu chuẩn nghiệm thu:** Giao diện sạch sẽ chuẩn SaaS, kết nối lưu và làm mới dữ liệu thật.
  - **Tệp liên quan:** `src/app/(dashboard)/admin/ai-gateway/page.tsx`

## Giai đoạn 4: Kiểm thử, Tối ưu & Hoàn tất
- [x] **Task 4.1: Kiểm tra TypeScript Typecheck**
  - **Lệnh:** `npm run typecheck`
  - **Tiêu chuẩn nghiệm thu:** 0 lỗi TypeScript.

- [x] **Task 4.2: Chạy bộ kiểm thử tự động Vitest**
  - **Lệnh:** `npx vitest run`
  - **Tiêu chuẩn nghiệm thu:** Toàn bộ 92 test files (1,454+ tests) đạt PASS 100%.

- [x] **Task 4.3: Rà soát giao diện và nghiệm thu với người dùng**
