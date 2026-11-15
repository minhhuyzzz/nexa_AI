# Tuyên Bố Mục Đích (Statement of Intent): Tái Thiết Kế & Nâng Cấp Không Gian Phòng Thi Trực Tiếp

*Thời gian ghi nhận:* 15/11/2026  
*Trạng thái:* Đã xác nhận (Confirmed)

---

## 1. Kết Quả Đầu Ra (Outcome)
Hệ thống phòng thi trực tiếp (Live Exam Room) được tái cấu trúc và nâng cấp toàn diện trên cả 2 vai trò: Giám thị (Host) và Thí sinh (Candidate):

1. **Bảng điều khiển Giám thị (`/live/control`):**
   - Tinh gọn giao diện điều hành, loại bỏ card và nút thừa rườm rà.
   - Gộp khối Mã PIN và mã QR thành cụm thông tin hiện đại, đồng bộ.
   - Thay thế toàn bộ checkbox quy chế thô bằng **nút gạt Toggle Switch** cao cấp.
   - Thêm **cài đặt đếm ngược phát đề** (Tức thì, 5s, 10s, 30s, 60s) đồng bộ thời gian thực sang màn hình thí sinh trước khi chính thức mở bài thi.
2. **Phòng chờ Thí sinh (`/live/waiting-room`):**
   - Đưa chỉ báo Trạng thái mạng (`Mạng ổn định`) lên topbar cạnh nút điều khiển âm thanh.
   - Chuyển card "Quy Chế & Hướng Dẫn Làm Bài" chiếm diện tích thành **icon trợ giúp `(?)`** mở modal/dialog chi tiết khi cần.
   - Thay thế danh sách thí sinh phẳng bằng **bong bóng nổi trôi lơ lửng (Floating Name Bubbles)** hiển thị tên và avatar gọn gàng.
   - Cung cấp các nút tương tác phản hồi (vẫy tay, bắn tim, cổ vũ) giữa các thí sinh trong phòng chờ.
   - Đồng bộ hiển thị màn hình đếm ngược số to ngân vang khi Host kích hoạt phát đề.
3. **Khắc phục lỗi logic giám sát:**
   - Chỉ kích hoạt theo dõi `visibilitychange`/`window.blur` và gửi cảnh báo `TAB_SWITCH_ALERT` khi Host thực sự bật cài đặt giám sát đổi tab (`tab_switch_alert: true`).
   - Màn hình giám sát Host tự động ẩn hoặc tắt card cảnh báo rời tab nếu ca thi không áp dụng quy chế này.
4. **Màn hình nộp bài Thí sinh (`/live/submitted`):**
   - Duy trì chế độ toàn màn hình sau khi nộp bài.
   - Hiển thị ngay **Thẻ thành tích cá nhân** (thứ hạng tạm thời, số câu làm được, điểm số, tỉ lệ chính xác %) kèm trạng thái chờ.
   - Tự động chuyển sang **Bục vinh danh chung cuộc (Podium Top 1-2-3)** khi Giám thị nhấn *"Công bố kết quả"*.
5. **Chuẩn hóa thang điểm, xóa bỏ tàn dư thang điểm 100:**
   - Xóa bỏ triệt để các chuỗi `Điểm (/100)`, `/ 100` tại trang kết quả giám thị (`/personal/live-room/[id]/results`), các bảng thống kê và file xuất dữ liệu CSV.

---

## 2. Người Thụ Hưởng (User)
- **Giám thị / Người tổ chức:** Điều hành ca thi tinh gọn, trực quan, kiểm soát chính xác quy chế và thời điểm phát đề.
- **Thí sinh:** Trải nghiệm phòng chờ hiện đại, không gian thi tập trung, xem kết quả cá nhân minh bạch và đón nhận vinh danh công bằng.

---

## 3. Lý Do Thực Hiện Ngay (Why now)
- Giao diện phòng thi trực tiếp trước đó còn nặng nề, nhiều card/nút dàn trải gây rối mắt.
- Phòng chờ thí sinh thiếu chiều sâu cảm xúc và tính kết nối.
- Lỗi tự động ghi nhận vi phạm rời tab khi Host không bật giám sát gây hoang mang cho thí sinh.
- Tàn dư thang điểm 100 gây mâu thuẫn trực tiếp với triết lý đánh giá năng lực số của NEXA.

---

## 4. Tiêu Chí Thành Công (Success)
- Giao diện đạt chuẩn tối giản cao cấp (Apple / Swiss Style), nền trắng sáng (`#FFFFFF`) ở Light Mode và nền đen tuyền (`#000000`) ở Dark Mode.
- Sự kiện đếm ngược, nộp bài và công bố kết quả đồng bộ thời gian thực qua Supabase Realtime không có độ trễ bất thường.
- 100% các bộ kiểm thử tự động (92 test suites, >1.446 tests) tiếp tục PASS, không xảy ra hồi quy.

---

## 5. Ràng Buộc Nghiêm Ngặt (Constraint)
- Tuân thủ nghiêm ngặt quy tắc [AGENTS.md](file:///c:/nexa/AGENTS.md):
  - Màu nền: Light `#FFFFFF`, Dark `#000000`, nút CTA Cobalt `#2563EB`.
  - Tuyệt đối **không sử dụng icon emoji** trong mã JSX (dùng `lucide-react` như `Crown`, `Trophy`, `Award`, `Medal`).
  - Tuyệt đối **không sử dụng đường viền ngang** (`border-t`, `border-b`).
  - Không sửa các migration lịch sử trong cơ sở dữ liệu.

---

## 6. Phạm Vi Loại Trừ (Out of scope)
- Không can thiệp vào luồng làm bài khảo thí chuẩn cá nhân độc lập ngoài phòng live.
- Không thay đổi thuật toán chấm điểm 5 miền năng lực backend.
