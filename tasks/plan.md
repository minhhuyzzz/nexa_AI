# Kế Hoạch Triển Khai: Tái Thiết Kế & Nâng Cấp Không Gian Phòng Thi Trực Tiếp

## Tổng Quan (Overview)
Kế hoạch này thực hiện nâng cấp toàn diện không gian phòng thi trực tiếp (Live Exam Room) của nền tảng NEXA AI trên cả hai đầu: Bảng điều khiển Giám thị (`/live/control`), Phòng chờ Thí sinh (`/live/waiting-room`), Màn hình làm bài (`/personal/take/[id]`), Màn hình nộp bài Thí sinh (`/live/submitted`) và Trang kết quả Giám thị (`/personal/live-room/[id]/results`). Toàn bộ giao diện được chuyển sang phong cách tối giản cao cấp (Apple / Swiss Design), tinh gọn tối đa các thành phần thừa, loại bỏ triệt để thang điểm 100 và lỗi tự động giám sát đổi tab, đồng thời bổ sung tính năng đếm ngược trước khi phát đề và Bục vinh danh (Podium) chung cuộc.

## Quyết Định Kiến Trúc (Architecture Decisions)
1. **Loại bỏ triệt để thang điểm 100:**
   - Thay thế các chuỗi tĩnh `Điểm (/100)`, `/ 100` tại các thẻ KPI, bảng điểm và file CSV xuất ra thành `Điểm số` hoặc `Điểm đạt được`.
   - Điểm số được hiển thị chuẩn hóa dựa trên tổng điểm câu hỏi hoặc số câu đúng thực tế.
2. **Kiểm soát giám sát đổi tab có điều kiện:**
   - Trong `src/app/(dashboard)/personal/take/[id]/page.tsx`, chỉ gắn event listener `visibilitychange` và `window.blur` khi `proctoringProfile?.tab_switch_alert === true`.
   - Màn hình giám sát của Host tự động ẩn thẻ theo dõi vi phạm rời tab nếu phòng thi không bật tính năng này.
3. **Bộ đếm ngược phát đề (Host & Candidate Synchronization):**
   - Host có thể cấu hình thời gian đếm ngược trước khi đề được phát: `0s` (Tức thì), `5s`, `10s`, `30s`, `60s`.
   - Khi Host bấm phát đề, hệ thống phát sự kiện Supabase Broadcast `START_COUNTDOWN` kèm số giây còn lại. Cả Host và Thí sinh đều thấy đồng hồ đếm ngược với âm thanh tích tắc Web Audio API. Khi hết giờ, Host gọi API `/api/rooms/start` và phát sự kiện `START` để cùng chuyển vào bài thi.
4. **Phòng chờ Thí sinh với Bong bóng nổi (Floating Name Bubbles) & Tương tác Reaction:**
   - Thay danh sách phẳng bằng vùng bong bóng nổi nhẹ nhàng với hiệu ứng CSS keyframe animation (`@keyframes float`).
   - Hỗ trợ gửi các tương tác nhanh (vẫy tay, bắn tim, cổ vũ) qua kênh Supabase Broadcast và tạo hiệu ứng bong bóng bay lên.
   - Chuyển card quy chế thành icon `(?)` / `HelpCircle` bật modal chi tiết khi click, giúp phòng chờ thoáng đãng và có chiều sâu.
5. **Màn hình Nộp bài Thí sinh & Bục vinh danh Podium:**
   - Duy trì chế độ toàn màn hình khi thí sinh nộp bài xong.
   - Thí sinh nộp xong thấy ngay **Thẻ thành tích cá nhân** (Thứ hạng tạm thời, số câu làm được, điểm số, tỉ lệ chính xác %) kèm thông báo đợi công bố.
   - Khi Giám thị bấm "Công bố kết quả", hệ thống phát sự kiện `RESULTS_PUBLISHED`, màn hình thí sinh chuyển sang **Bục vinh danh chung cuộc (Podium Top 1, 2, 3)** (sử dụng icon `Crown`, `Trophy`, `Medal`, `Award` từ `lucide-react`, tuyệt đối không dùng emoji).

---

## Danh Sách Nhiệm Vụ (Task List)

### Giai đoạn 1: Sửa lỗi Thang điểm 100 & Giám sát đổi tab
- [ ] Task 1.1: Xóa bỏ triệt để thang điểm 100 tại trang Kết quả Giám thị và file xuất CSV
- [ ] Task 1.2: Sửa logic tự động cảnh báo đổi tab khi Host không bật tính năng giám sát

### Checkpoint 1: Nền tảng Logic & Báo cáo kết quả sạch sẽ
- [ ] Màn hình kết quả không còn bất kỳ chuỗi `100` nào.
- [ ] Làm bài không bật giám sát tab thì không có cảnh báo vi phạm.
- [ ] Bộ test Vitest hiện tại vượt qua 100%.

### Giai đoạn 2: Tinh gọn Bảng điều khiển Giám thị (`/live/control`)
- [ ] Task 2.1: Tinh gọn Sảnh chờ Host, thay thế 6 checkbox bằng Toggle Switch
- [ ] Task 2.2: Thêm bộ đếm ngược thời gian trước khi phát đề (0s - 60s) đồng bộ Realtime

### Checkpoint 2: Host Control mượt mà & kiểm soát ca thi chuẩn xác
- [ ] Giao diện Host tinh gọn, nút gạt hoạt động nhạy bén.
- [ ] Kích hoạt đếm ngược phát đề phát tín hiệu chuẩn xác.

### Giai đoạn 3: Tái thiết kế Phòng chờ Thí sinh (`/live/waiting-room`)
- [ ] Task 3.1: Đưa trạng thái mạng lên topbar và chuyển card quy chế thành modal popup
- [ ] Task 3.2: Xây dựng khu vực bong bóng thí sinh trôi lơ lửng và nút tương tác reaction
- [ ] Task 3.3: Hiển thị màn hình đếm ngược số to ngân vang khi nhận tín hiệu từ Host

### Checkpoint 3: Trải nghiệm Phòng chờ Thí sinh đẳng cấp & sống động
- [ ] Bong bóng trôi lơ lửng hiển thị mượt mà, gửi reaction tức thì.
- [ ] Đếm ngược số to hiển thị đồng bộ khi Host bấm phát đề.

### Giai đoạn 4: Màn hình Nộp bài Thí sinh (`/live/submitted`) & Bục vinh danh Podium
- [ ] Task 4.1: Xây dựng Thẻ thành tích cá nhân toàn màn hình sau khi nộp bài
- [ ] Task 4.2: Tích hợp Bục vinh danh Podium Top 1-2-3 khi Giám thị công bố kết quả

### Giai đoạn 5: Kiểm thử Toàn diện & Xác thực Hệ thống
- [ ] Task 5.1: Bổ sung bộ test tự động TDD Vitest cho các tính năng mới
- [ ] Task 5.2: Kiểm tra TypeScript, chạy toàn bộ 92 test suites và build dự án

### Checkpoint Hoàn Tất (Complete)
- [ ] Toàn bộ luồng hoạt động mượt mà từ Tạo phòng -> Đợi -> Đếm ngược -> Làm bài -> Nộp bài -> Công bố kết quả.
- [ ] Không có hồi quy, 100% test files tiếp tục PASS.

---

## Quản Trị Rủi Ro (Risks & Mitigations)
| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| --- | --- | --- |
| Lệch thời gian đếm ngược giữa Host và Thí sinh do độ trễ mạng | Trung bình | Gửi `startTime` (timestamp tương đối/tuyệt đối) trong payload broadcast để client tự căn chỉnh chính xác. |
| Hiệu ứng bong bóng gây quá tải DOM khi phòng có quá nhiều thí sinh | Thấp | Giới hạn hiển thị tối đa 40 bong bóng cùng lúc trên canvas/vùng CSS, phân bổ vị trí ngẫu nhiên không chồng chéo. |
| Vi phạm quy tắc AGENTS.md về emoji trong JSX khi làm Bục vinh danh | Cao | Dùng icon chuẩn của `lucide-react` (`Crown`, `Trophy`, `Medal`, `Award`), tuyệt đối không render ký tự emoji. |
