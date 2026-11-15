# Danh Sách Nhiệm Vụ Triển Khai: Tinh Gọn Luồng Live Room & Tái Cấu Trúc Cài Đặt Phòng Thi

## Giai đoạn 1: Trang Chọn Đề & Mở Phòng (`/personal/live-room/new`)
- [x] **Task 1.1: Thêm bộ chọn Thời lượng làm bài vào `CreateLiveRoomWizardView`**
  - **Mô tả:** Trong component `CreateLiveRoomWizardView.tsx`, bổ sung giao diện chọn thời lượng làm bài (presets `15p`, `30p`, `45p`, `60p` và ô nhập tùy chỉnh `phút`). Khi người dùng chọn đề thi, mặc định `durationMinutes` theo `duration_minutes` của đề thi.
  - **Tệp:** `src/components/dashboard/live-room/CreateLiveRoomWizardView.tsx`

- [x] **Task 1.2: Truyền `durationMinutes` được chọn vào API `POST /api/evaluator/rooms`**
  - **Mô tả:** Trong hàm `handleCreateAndEnterLobby`, truyền giá trị `durationMinutes` từ state thay vì hardcode giá trị gốc của đề thi.
  - **Tệp:** `src/components/dashboard/live-room/CreateLiveRoomWizardView.tsx`

## Giai đoạn 2: Tinh Giản Sảnh Chờ Điều Khiển Giám Thị (`/live/control`)
- [x] **Task 2.1: Xóa bỏ tab "Hẹn giờ ca thi" và khối chọn thời lượng ở cột phải sảnh chờ**
  - **Mô tả:** Xóa bỏ tab chuyển đổi "Phát trực tiếp / Hẹn giờ ca thi", xóa form chọn ngày giờ bắt đầu/kết thúc, và xóa khối chọn thời lượng ở cột phải trong `src/app/live/control/page.tsx`.
  - **Tệp:** `src/app/live/control/page.tsx`

- [x] **Task 2.2: Tinh chỉnh cột phải tập trung vào Themes, Đếm ngược & Quy chế**
  - **Mô tả:** Cột phải chỉ còn: 4 Theme cards, Đếm ngược phát đề (0s, 3s, 5s), Cài đặt khảo thí & Quy chế, và Bật/tắt Âm thanh. Đảm bảo giao diện cân đối, thoáng đãng, không viền ngang thừa.
  - **Tệp:** `src/app/live/control/page.tsx`

## Giai đoạn 3: Kiểm Thử & Xác Nhận
- [x] **Task 3.1: Kiểm tra TypeScript (`npm run typecheck`) và chạy TDD tests**
  - **Mô tả:** Xác nhận không có lỗi kiểu và các ca kiểm thử trong `tests/challenger-m5-live-room-tdd.test.ts` hoạt động đúng.
  - **Tệp:** `tests/challenger-m5-live-room-tdd.test.ts`

- [x] **Task 3.2: Chạy toàn bộ test suites (`npx vitest run`)**
  - **Mô tả:** Đảm bảo toàn bộ 1454+ tests tiếp tục PASS 100%.

- [x] **Task 3.3: Commit và Push mã nguồn**
