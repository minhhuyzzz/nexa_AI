# Statement of Intent: Cài đặt nền tảng NEXA AI (Platform Settings)

## 1. Mục tiêu (Outcome)
Tái cấu trúc trang `/admin/settings` thành khu vực Cài đặt chuẩn SaaS hiện đại, tập trung vào các thông số quản trị mà Super Admin thực sự điều chỉnh được trên hệ thống. Loại bỏ 100% các tab rác, dữ liệu giả lập và các nhãn tĩnh không có tính năng.

## 2. Người dùng (User)
Super Admin nền tảng NEXA (những tài khoản được cấp quyền qua biến môi trường `SUPERADMIN_EMAILS`).

## 3. Lý do thực hiện (Why now)
- Giao diện cũ chứa các tab không phù hợp với kiến trúc nền tảng:
  - Tab "Vai trò admin nội bộ": Định nghĩa các vai trò thuộc Tổ chức (`EVALUATOR`, `ORG_ADMIN`) thay vì Admin nền tảng.
  - Tab "Tích hợp & Webhook": Chứa các ô nhập API key/Secret nhạy cảm (payOS, Resend) vốn đã thuộc tầng hạ tầng bí mật `.env`.
  - Tab "Nhật ký kiểm toán": Chứa các dòng log giả lập bằng text cứng, trong khi hệ thống đã có riêng trang `/admin/compliance`.
  - Các trường dữ liệu mẫu như email `ops@nexa.edu.vn`, Slack URL hẹn giờ giả lập gây hiểu nhầm về độ hoàn thiện của hệ thống.

## 4. Phạm vi chức năng thực tế
### 4.1. Vận hành hệ thống (System Operations)
- **Tên nền tảng (`platformName`):** Tên hiển thị toàn sàn (mặc định: `NEXA AI`).
- **Email hỗ trợ (`supportEmail`):** Email tiếp nhận thắc mắc và hỗ trợ người dùng.
- **Múi giờ hệ thống (`systemTimezone`):** Múi giờ chuẩn hóa báo cáo và lịch thi (mặc định: `Asia/Ho_Chi_Minh` - GMT+7).
- **Chế độ bảo trì (`maintenanceMode`):** Công tắc chuyển toàn bộ nền tảng sang chế độ bảo trì, chỉ Super Admin mới có quyền truy cập.

### 4.2. Quy tắc khảo thí & Dữ liệu (Assessment & Data Rules)
- **Yêu cầu kiểm duyệt trước khi xuất bản đề chuẩn (`requireContentModeration`):** Mọi đề khảo thí chuẩn của hệ thống phải được kiểm duyệt trước khi phát hành rộng rãi.
- **Cách ly ngân hàng đề hệ thống (`isolateCanonicalBank`):** Đảm bảo kho đề chuẩn Canonical độc lập với đề do người dùng tự tạo.

### 4.3. Phiên làm việc & Lưu trữ (Session & Storage)
- **Thời gian phiên làm việc (`sessionTimeout`):** Cấu hình thời gian hết hạn phiên không hoạt động (`4h`, `8h`, `24h`, `7d`).
- **Thời gian lưu trữ dữ liệu (`dataRetention`):** Chính sách lưu trữ dữ liệu khảo thí (`12m`, `24m`, `36m`, `forever`).
- **Giới hạn kích thước tệp tải lên (`maxUploadSize`):** Dung lượng tối đa cho file đính kèm (`25mb`, `50mb`, `100mb`).

## 5. Tích hợp Backend & Dữ liệu thật
- Khi tải trang, gọi `GET /api/admin/settings` để nạp dữ liệu cấu hình thực tế từ bảng `system_settings` trong Supabase.
- Khi bấm "Lưu cấu hình", gửi `POST /api/admin/settings` để lưu cấu hình và tự động ghi nhật ký kiểm toán vào `admin_audit_logs`.

## 6. Tiêu chuẩn giao diện & Ràng buộc
- Tuân thủ quy chuẩn `AGENTS.md`: Nền Light trắng (`#FFFFFF`), Dark đen (`#000000`), chữ than trung tính (`#171717`/`#262626`), nút Cobalt (`#2563EB`).
- **Tuyệt đối không sử dụng đường viền ngang** (`border-b`, `<hr>`).
- Không hiển thị dữ liệu giả, không có logic giả lập `setTimeout`.
