# Danh Sách Nhiệm Vụ Triển Khai: Tái Thiết Kế & Nâng Cấp Không Gian Phòng Thi Trực Tiếp

## Giai đoạn 1: Sửa lỗi Thang điểm 100 & Giám sát đổi tab

- [x] **Task 1.1: Xóa bỏ triệt để thang điểm 100 tại trang Kết quả Giám thị và file xuất CSV**
  - **Mục tiêu:** Loại bỏ các chuỗi tĩnh `Điểm (/100)` và `/ 100` tại trang kết quả giám thị (`src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`), thay thế bằng `Điểm đạt được` hoặc điểm số thực tế của bài thi, cập nhật tiêu đề cột bảng và cấu trúc xuất file CSV.
  - **Tiêu chí nghiệm thu:**
    - [x] Thẻ KPI Điểm trung bình và Điểm cao nhất hiển thị điểm thực tế, không có `/ 100`.
    - [x] Tiêu đề cột bảng điểm đổi từ `Điểm (/100)` sang `Điểm đạt được` (hoặc `Điểm số`).
    - [x] File CSV xuất ra có tiêu đề cột chuẩn `Điểm Số`, không còn `(/100)`.
  - **Kiểm tra:**
    - [x] Chạy lệnh tìm kiếm trong tệp kết quả không còn chuỗi `100` tĩnh.
    - [x] Giao diện hiển thị số điểm rõ ràng, không có lỗi hiển thị.
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`
  - **Quy mô:** Nhỏ (1 tệp)

- [x] **Task 1.2: Sửa logic tự động cảnh báo đổi tab khi Host không bật tính năng giám sát**
  - **Mục tiêu:** Kiểm tra cờ `tab_switch_alert` từ `proctoringProfile` trước khi kích hoạt bộ lắng nghe `visibilitychange` và `window.blur` trong `src/app/(dashboard)/personal/take/[id]/page.tsx`. Đồng thời trên màn hình Giám thị (`/live/control`), chỉ hiển thị thẻ theo dõi cảnh báo rời tab khi tính năng này thực sự được kích hoạt.
  - **Tiêu chí nghiệm thu:**
    - [x] Khi `proctoringProfile.tab_switch_alert !== true`, thí sinh chuyển tab hoặc mất focus không bị ghi nhận vi phạm và không gửi sự kiện `TAB_SWITCH_ALERT`.
    - [x] Màn hình giám sát ca thi của Host ẩn thẻ cảnh báo rời tab hoặc hiển thị trạng thái "Không bật giám sát đổi tab".
  - **Kiểm tra:**
    - [x] Chạy kiểm thử giả lập chuyển tab khi tắt tính năng giám sát -> không có cảnh báo nào được gửi.
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/(dashboard)/personal/take/[id]/page.tsx`, `src/app/live/control/page.tsx`
  - **Quy mô:** Vừa (2 tệp)

## Checkpoint 1: Nền tảng Logic & Báo cáo kết quả chuẩn xác
- [x] Màn hình kết quả sạch bóng các chuỗi `/ 100`.
- [x] Không còn hiện tượng tự động bắt lỗi rời tab khi chưa bật giám sát.
- [x] Toàn bộ test Vitest hiện có vẫn chạy thành công.

---

## Giai đoạn 2: Tinh gọn Bảng điều khiển Giám thị (`/live/control`)

- [x] **Task 2.1: Tinh gọn Sảnh chờ Host, thay thế 6 checkbox bằng Toggle Switch**
  - **Mục tiêu:** Tinh giản layout sảnh chờ của Host: gộp cụm Mã PIN và mã QR thành một khối card tinh gọn; chuyển đổi toàn bộ 6 checkbox quy chế sang nút gạt **Toggle Switch** (`w-10 h-5 rounded-full peer-checked:bg-blue-600 transition-colors`).
  - **Tiêu chí nghiệm thu:**
    - [x] Gộp mã PIN to và QR code thành 1 cụm card trực quan, thẩm mỹ, tiết kiệm diện tích.
    - [x] 6 tùy chọn quy chế (Xáo trộn câu hỏi, Xáo trộn đáp án, Báo đúng/sai tức thì, Cảnh báo rời tab, Tự nộp bài, Khóa phòng thi) sử dụng nút gạt Switch hiện đại, có hiệu ứng chuyển đổi mượt mà.
    - [x] Tuân thủ bảng màu chuẩn: Light mode trắng `#FFFFFF`, Dark mode đen `#000000`, nút bật màu Cobalt `#2563EB`.
  - **Kiểm tra:**
    - [x] Bật/tắt các nút gạt phản hồi tức thì, lưu đúng trạng thái vào state và truyền vào `proctoringProfile` khi phát đề.
  - **Phụ thuộc:** Checkpoint 1
  - **Tệp liên quan:** `src/app/live/control/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 2.2: Thêm bộ đếm ngược thời gian trước khi phát đề (0s - 60s) đồng bộ Realtime**
  - **Mục tiêu:** Cung cấp bộ chọn thời gian đếm ngược trước khi phát đề (Tức thì / 0s, 5s, 10s, 30s, 60s). Khi Host bấm Bắt đầu phát đề: nếu có đếm ngược, phát sự kiện Supabase Broadcast `START_COUNTDOWN` để cả Host và Thí sinh cùng đếm ngược; hết thời gian mới thực hiện kích hoạt bắt đầu ca thi.
  - **Tiêu chí nghiệm thu:**
    - [x] Bộ chọn thời gian đếm ngược trực quan, dễ thao tác (tối đa 1 phút).
    - [x] Khi bấm phát đề: nút chuyển sang đếm ngược kèm tùy chọn hủy đếm ngược nếu cần.
    - [x] Khi hết thời gian đếm ngược: tự động gọi API `/api/rooms/start` và phát sự kiện `START` cho toàn phòng.
  - **Kiểm tra:**
    - [x] Chọn đếm ngược 5 giây, bấm bắt đầu -> đồng hồ đếm 5, 4, 3, 2, 1 rồi kích hoạt thành công phòng thi.
  - **Phụ thuộc:** Task 2.1
  - **Tệp liên quan:** `src/app/live/control/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

## Checkpoint 2: Host Control mượt mà & kiểm soát ca thi chuẩn xác
- [x] Giao diện Host tinh gọn, không gian thoáng đãng.
- [x] Nút gạt Toggle Switch hoạt động nhạy bén.
- [x] Kích hoạt đếm ngược phát đề phát tín hiệu đồng bộ qua Realtime.

---

## Giai đoạn 3: Tái thiết kế Phòng chờ Thí sinh (`/live/waiting-room`)

- [x] **Task 3.1: Đưa trạng thái mạng lên topbar và chuyển card quy chế thành modal popup**
  - **Mục tiêu:** Giải phóng diện tích sảnh chờ thí sinh: đưa huy hiệu Trạng thái mạng (`Mạng ổn định`) lên topbar cạnh nút điều khiển âm thanh; chuyển card lớn "Quy Chế & Hướng Dẫn Làm Bài" thành icon `(?)` / `HelpCircle` mở Sheet/Modal quy chế khi click.
  - **Tiêu chí nghiệm thu:**
    - [x] Topbar có đủ: Tên ca thi, Trạng thái mạng (xanh lá), Bật/tắt âm thanh, Mã PIN và Nút rời phòng.
    - [x] Bấm vào icon `(?)` hiển thị modal/dialog chi tiết quy chế ca thi đẹp mắt, bấm đóng dễ dàng.
    - [x] Khu vực trung tâm phòng chờ trở nên thông thoáng, tập trung vào trải nghiệm kết nối.
  - **Kiểm tra:**
    - [x] Mở trang waiting-room, click icon `(?)` xem modal mở mượt mà và không che khuất luồng chính.
  - **Phụ thuộc:** Checkpoint 2
  - **Tệp liên quan:** `src/app/live/waiting-room/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 3.2: Xây dựng khu vực bong bóng thí sinh trôi lơ lửng và nút tương tác reaction**
  - **Mục tiêu:** Hiển thị người tham gia trong sảnh chờ dưới dạng các **bong bóng nổi trôi lơ lửng (Floating Name Bubbles)** nhẹ nhàng (chỉ hiện tên và avatar viết tắt). Bổ sung thanh tương tác gửi reaction (vẫy tay, bắn tim, cổ vũ) giữa các thí sinh.
  - **Tiêu chí nghiệm thu:**
    - [x] Các thí sinh hiển thị dạng bong bóng nổi với hoạt ảnh CSS trôi nổi nhẹ nhàng (`animate-float`).
    - [x] Nút tương tác reaction (👋 Vẫy tay, 💙 Bắn tim, 👏 Cổ vũ) gửi sự kiện broadcast `REACTION` đến các thí sinh trong phòng.
    - [x] Khi nhận reaction, bong bóng tương ứng hoặc biểu tượng bay lên sinh động mà không làm đơ giật UI.
  - **Kiểm tra:**
    - [x] Thử mở 2 tab thí sinh, bấm reaction tab này thì tab kia hiển thị hiệu ứng tương tác.
  - **Phụ thuộc:** Task 3.1
  - **Tệp liên quan:** `src/app/live/waiting-room/page.tsx`, `src/app/globals.css`
  - **Quy mô:** Vừa (2 tệp)

- [x] **Task 3.3: Hiển thị màn hình đếm ngược số to ngân vang khi nhận tín hiệu từ Host**
  - **Mục tiêu:** Lắng nghe sự kiện `START_COUNTDOWN` từ Host. Khi nhận tín hiệu, hiển thị overlay đếm ngược số to toàn màn hình kèm âm thanh tích tắc Web Audio API trước khi chính thức chuyển hướng vào làm bài.
  - **Tiêu chí nghiệm thu:**
    - [x] Nhận broadcast `START_COUNTDOWN`: hiển thị màn hình đếm ngược số to (5..4..3..2..1.. Bắt đầu!).
    - [x] Phát âm thanh Web Audio API nhịp nhàng từng giây nếu thí sinh bật âm thanh.
    - [x] Khi chuyển sang sự kiện `START`: tự động điều hướng vào trang làm bài `/personal/take/[id]`.
  - **Kiểm tra:**
    - [x] Host bấm phát đề có đếm ngược -> màn hình thí sinh hiện đếm ngược đồng bộ tức thì.
  - **Phụ thuộc:** Task 2.2, Task 3.2
  - **Tệp liên quan:** `src/app/live/waiting-room/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

## Checkpoint 3: Trải nghiệm Phòng chờ Thí sinh sống động & hiện đại
- [x] Bong bóng trôi lơ lửng hoạt động trơn tru.
- [x] Gửi và nhận reaction thời gian thực thành công.
- [x] Đếm ngược số to ngân vang trước khi vào thi chính xác.

---

## Giai đoạn 4: Màn hình Nộp bài Thí sinh (`/live/submitted`) & Bục vinh danh Podium

- [x] **Task 4.1: Xây dựng Thẻ thành tích cá nhân toàn màn hình sau khi nộp bài**
  - **Mục tiêu:** Giữ nguyên chế độ toàn màn hình cho thí sinh khi nộp bài xong. Hiển thị Thẻ thành tích cá nhân: Thứ hạng tạm thời, Số câu làm được, Điểm số đạt được, Tỉ lệ chính xác (%) kèm trạng thái chờ Giám thị công bố kết quả chung cuộc.
  - **Tiêu chí nghiệm thu:**
    - [x] Nộp bài xong không bị thoát toàn màn hình.
    - [x] Thẻ thành tích cá nhân hiển thị rõ ràng: Điểm đạt được, Số câu đúng, Tỉ lệ %, Thứ hạng tạm thời.
    - [x] Hiển thị thông báo trạng thái: "Đang chờ Giám thị công bố Bục vinh danh chung cuộc".
  - **Kiểm tra:**
    - [x] Thí sinh nộp bài -> hiển thị đầy đủ thông số cá nhân mà không bị trắng trang hay lỗi layout.
  - **Phụ thuộc:** Checkpoint 3
  - **Tệp liên quan:** `src/app/live/submitted/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 4.2: Tích hợp Bục vinh danh Podium Top 1-2-3 khi Giám thị công bố kết quả**
  - **Mục tiêu:** Khi Giám thị bấm "Công bố kết quả" ở trang kết quả (`/personal/live-room/[id]/results`), hệ thống phát sự kiện `RESULTS_PUBLISHED`. Màn hình thí sinh tự động chuyển sang **Bục vinh danh Podium Top 1, 2, 3** với thiết kế sang trọng, dùng icon chuẩn Lucide (`Crown`, `Trophy`, `Medal`, `Award`), tuyệt đối không dùng emoji.
  - **Tiêu chí nghiệm thu:**
    - [x] Thiết kế bục Podium 3 bậc: Bậc 1 ở giữa cao nhất (icon `Crown`/`Trophy`), Bậc 2 bên trái (icon `Medal`), Bậc 3 bên phải (icon `Award`).
    - [x] Hiển thị tên thí sinh, điểm số, thời gian hoàn thành trên từng bậc vinh danh.
    - [x] Thí sinh của tài khoản hiện tại được đánh dấu nổi bật (cho biết mình đứng thứ mấy trong phòng).
    - [x] Tuân thủ nghiêm ngặt AGENTS.md: không icon emoji trong JSX, màu sắc Light/Dark chuẩn xác.
  - **Kiểm tra:**
    - [x] Host bấm công bố kết quả -> màn hình thí sinh tự động bung mở Podium Top 3 mượt mà.
  - **Phụ thuộc:** Task 4.1, Task 1.1
  - **Tệp liên quan:** `src/app/live/submitted/page.tsx`, `src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`
  - **Quy mô:** Vừa (2 tệp)

---

## Giai đoạn 5: Kiểm thử Toàn diện & Xác thực Hệ thống

- [x] **Task 5.1: Bổ sung bộ test tự động TDD Vitest cho các tính năng mới**
  - **Mục tiêu:** Viết bộ test kiểm thử các luồng mới trong `tests/challenger-m5-live-room-tdd.test.ts`:
    - Kiểm thử cấu hình đếm ngược phát đề.
    - Kiểm thử bỏ qua giám sát vi phạm tab khi `tab_switch_alert` là false.
    - Kiểm thử công bố kết quả và dữ liệu bảng xếp hạng Podium.
  - **Tiêu chí nghiệm thu:**
    - [x] Toàn bộ các test cases mới đều PASS 100%.
  - **Kiểm tra:**
    - [x] `npx vitest run tests/challenger-m5-live-room-tdd.test.ts` xanh hoàn toàn.
  - **Phụ thuộc:** Giai đoạn 1 đến Giai đoạn 4
  - **Tệp liên quan:** `tests/challenger-m5-live-room-tdd.test.ts`
  - **Quy mô:** Nhỏ (1 tệp)

- [x] **Task 5.2: Kiểm tra TypeScript, chạy toàn bộ 92 test suites và build dự án**
  - **Mục tiêu:** Chạy kiểm tra kiểu TypeScript (`npm run typecheck`), chạy toàn bộ 92 test suites của toàn hệ thống và kiểm tra an toàn bản build Next.js.
  - **Tiêu chí nghiệm thu:**
    - [x] `npm run typecheck` đạt 0 lỗi.
    - [x] 92 test files (>1.446 tests) PASS 100%.
  - **Kiểm tra:**
    - [x] Chạy `npm run typecheck` và `npx vitest run`.
  - **Phụ thuộc:** Task 5.1
  - **Tệp liên quan:** Toàn bộ hệ thống
  - **Quy mô:** Nhỏ
