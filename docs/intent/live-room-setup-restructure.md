# Statement of Intent: Tinh Gọn Luồng Live Room & Khởi Tạo Phòng Thi

## 1. Tóm tắt Định hướng (Summary of Intent)
- **Mục tiêu:** Loại bỏ hoàn toàn tính năng "Hẹn giờ ca thi" thừa thãi trong toàn bộ luồng Live Room; đưa cấu hình **Thời lượng làm bài** ra trang **Chọn đề & Mở phòng** (`/personal/live-room/new`); tối giản màn hình **Sảnh chờ điều khiển** (`/live/control`), giải phóng diện tích cho danh sách thí sinh và tập trung vào quy chế khảo thí.
- **Người dùng:** Giám thị / Người tổ chức khảo thí trực tiếp (mở phòng trong 5 giây, giao diện thoáng đãng, không bị phân tâm bởi lịch hẹn).
- **Lý do thay đổi:** Bản chất Live Room là sự kiện đồng bộ tức thời (synchronous); tính năng "hẹn giờ" gây lộn xộn, nhầm lẫn với tính năng Giao bài tập theo hạn chót (Assignments).

## 2. Thiết kế Chi tiết 2 Màn hình

### 2.1. Màn hình 1: Chọn đề thi & Mở sảnh chờ (`/personal/live-room/new`)
- Chọn bài đánh giá từ danh mục của người dùng hoặc tổ chức.
- Tên phòng thi (tự động gợi ý theo tên đề + giờ ca thi hiện tại).
- **Cài đặt Thời lượng làm bài:**
  - Nút chọn nhanh: `15p`, `30p`, `45p`, `60p`.
  - Ô nhập tùy chỉnh: `Tùy chỉnh: [45] phút`.
  - Mặc định nhận theo `duration_minutes` của đề thi đã chọn.
- Nút bấm chính: **"Mở phòng & Vào sảnh chờ"** $\rightarrow$ Tạo phòng tức thì và chuyển hướng sang `/live/control?roomId=...`.

### 2.2. Màn hình 2: Sảnh chờ điều khiển Giám thị (`/live/control`)
- **Bỏ hoàn toàn:**
  - Tab "Hẹn giờ ca thi" và form chọn ngày/giờ bắt đầu/kết thúc.
  - Khối nút chọn thời lượng làm bài to choán chỗ ở cột phải.
- **Hiển thị thời lượng:** Dạng nhãn thông tin tóm tắt trên thanh thông tin phòng thi (ví dụ: `icon Đồng hồ` + `45 phút`).
- **Cột phải tập trung vào cấu hình tương tác:**
  1. Chủ đề giao diện (4 theme cards: Trắng tối giản, Space Blue, Aurora, Dark Professional).
  2. Đếm ngược khi phát đề (Phát ngay 0s, 3s, 5s).
  3. Cài đặt khảo thí & Quy chế (Xáo trộn câu/đáp án, Báo đúng sai tức thì, Cảnh báo rời tab, Xem đáp án & giải thích).
  4. Bật/tắt âm thanh hiệu ứng.
- **Cột trái:**
  - Khối mã PIN lớn, mã QR quét sảnh, nút Mở máy chiếu.
  - Danh sách thí sinh trong sảnh chờ (hiển thị thoáng đãng, avatar và trạng thái kết nối).

## 3. Ràng buộc & Tiêu chuẩn Tuân thủ (Constraints)
- `AGENTS.md`: Không dùng viền ngang (`border-t`, `border-b` thừa), không dùng emoji trong JSX (dùng `lucide-react`), giữ vững tương phản màu Light `#FFFFFF` / Dark `#000000`, Cobalt `#2563EB` cho CTA.
- Đảm bảo 100% test suites tiếp tục PASS (1454+ tests).
