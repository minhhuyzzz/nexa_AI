# Kế Hoạch Triển Khai: Tinh Gọn Luồng Live Room & Tái Cấu Trúc Cài Đặt Phòng Thi

## Mục tiêu
Đưa cài đặt Thời lượng làm bài (presets + custom) ra trang Chọn đề & Mở phòng (`/personal/live-room/new`), xóa bỏ hoàn toàn tính năng "Hẹn giờ ca thi" thừa thãi trong luồng Live Room, và tinh giản màn hình Giám thị (`/live/control`) tập trung vào đón thí sinh, chọn Theme, đếm ngược và quy chế khảo thí.

---

## Giai đoạn 1: Trang Chọn Đề & Mở Phòng (`/personal/live-room/new`)
- Thêm bộ chọn Thời lượng làm bài trực tiếp trong card Thông tin phòng thi (presets 15p, 30p, 45p, 60p + ô nhập tùy chỉnh phút).
- Khi chọn đề thi, mặc định `durationMinutes` theo thời lượng của đề thi.
- Truyền đúng `durationMinutes` được chọn vào payload `POST /api/evaluator/rooms`.
- Xác nhận nút "Mở phòng & Vào sảnh chờ" tạo phòng ngay lập tức.

## Giai đoạn 2: Tinh Giản Sảnh Chờ Điều Khiển Giám Thị (`/live/control`)
- Xóa bỏ tab "Hẹn giờ ca thi" và toàn bộ form chọn ngày/giờ bắt đầu/kết thúc ca thi.
- Xóa bỏ khối nút chọn thời lượng làm bài ở cột phải; giữ nhãn thông tin thời lượng ở thanh header.
- Cột bên phải chỉ còn:
  1. Chủ đề giao diện (4 theme cards)
  2. Tùy chọn Đếm ngược khi phát đề (0s, 3s, 5s)
  3. Cài đặt khảo thí & Quy chế (Xáo trộn, Instant feedback, Giám sát đổi tab, Xem đáp án)
  4. Nút bật/tắt Âm thanh
- Cột bên trái giữ mã PIN, QR, Máy chiếu và Danh sách thí sinh trong sảnh chờ rộng rãi.

## Giai đoạn 3: Backend API & Kiểm Thử
- Đảm bảo `POST /api/evaluator/rooms` nhận và lưu chính xác `duration_minutes` từ payload.
- Cập nhật test suites trong `tests/challenger-m5-live-room-tdd.test.ts`.
- Chạy `npm run typecheck` đạt 0 lỗi.
- Chạy `npx vitest run` bảo đảm 1454+ tests tiếp tục PASS 100%.
- Git commit & push.
