# TODO: Đơn Giản Hóa Trải Nghiệm Live Room & Sửa Lỗi Sảnh Chờ / Chọn Đề

- [ ] **Task 1: Sửa bug chọn đề & Tinh giản quy trình tạo phòng (`CreateLiveRoomWizardView.tsx`)**
  - [ ] Bỏ bộ lọc thời lượng dropdown (15p, 30p, 45p, 60p+).
  - [ ] Sửa dependency array và lưu đề được chọn ổn định, không để fallback đè đề của người dùng.
  - [ ] Bỏ Bước 2 rườm rà; chỉ 1 màn hình Chọn đề + cấu hình thời gian nhanh -> Nút `[ 🚀 Mở phòng thi ngay ]`.
  - [ ] Gọi POST `/api/evaluator/rooms` và chuyển hướng thẳng vào `/live/control?roomId=...`.
- [ ] **Task 2: Nâng cấp Sảnh Chờ Khảo Thí (`src/app/live/control/page.tsx`) theo chuẩn Quizizz**
  - [ ] Thêm nút `[ ← Quay lại ]` rõ ràng ở đầu trang.
  - [ ] Thêm Panel Cài Đặt Sảnh Chờ (Lobby Settings): tùy chỉnh số phút, chọn Theme (Minimal White, Space Blue, Aurora, Dark), toggle quy chế.
  - [ ] Nút CTA lớn `[ 🚀 Bắt đầu phát đề thi ]` kích hoạt phiên thi.
- [ ] **Task 3: Sửa lỗi vỡ layout bảng và KPI (`PersonalLiveRoomDashboardView.tsx`)**
  - [ ] Cố định min-width cho các cột bảng, loại bỏ lỗi co ép vỡ dòng chữ dọc.
  - [ ] Sửa logic đếm KPI: phòng `WAITING` được tính vào thẻ "Sắp diễn ra / Phòng chờ".
  - [ ] Nút thao tác: phòng `WAITING` có nút `[ Vào lại phòng ]` dẫn thẳng vào `/live/control?roomId=...`.
- [ ] **Task 4: Kiểm thử kỹ thuật & Xác nhận**
  - [ ] `npx tsc --noEmit` đạt 0 lỗi.
  - [ ] `npx vitest run` 100% passed.
