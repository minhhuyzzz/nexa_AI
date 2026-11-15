# Statement of Intent: Hoàn Thiện Luồng Live Exam & Bục Vinh Danh Kết Quả

## 1. Mục tiêu (Outcome)
Hoàn thiện trọn vẹn và liền mạch trải nghiệm khảo thí trực tiếp (Live Exam) trên toàn bộ hệ thống NEXA AI:
1. **Phát đề tức thì (0s delay):** Tải trước (prefetch) dữ liệu đề thi ngầm ngay khi thí sinh còn ở sảnh chờ (`/live/waiting-room`). Khi đếm ngược 3-2-1 kết thúc, thí sinh chuyển thẳng vào màn hình làm bài (`/personal/take/[id]`) tức khắc mà không bị xoay spinner "Đang chuẩn bị câu hỏi...".
2. **Đồng bộ thời gian chuẩn xác:** Đồng hồ đếm ngược được đồng bộ theo thời gian thực của phòng thi (Host / Server wall-clock), đảm bảo mọi thí sinh kết thúc cùng thời điểm và không ai bị thiệt thòi thời gian làm bài do độ trễ mạng.
3. **Tinh gọn giao diện Giám thị (`/live/control`):** Loại bỏ nút "Thu bài cả phòng" thừa trên thanh điều hướng; chỉ giữ duy nhất nút màu đỏ "Kết thúc ca & Chấm điểm" (tự động thu toàn bộ bài làm, lưu đáp án và chốt điểm cho tất cả thí sinh).
4. **Áp dụng 4 chủ đề giao diện (Themes) xuyên suốt:** Khi Giám thị chọn một chủ đề (*Trắng tối giản, Space Blue, Cyber Aurora, Dark Professional*), chủ đề này sẽ lập tức đồng bộ theo thời gian thực sang sảnh chờ thí sinh, màn hình máy chiếu, màn hình làm bài thi và màn hình kết quả.
5. **Khắc phục lỗi 404 & Công bố bục vinh danh:** Thí sinh nộp bài xong ở trạng thái chờ chốt ca; khi Giám thị kết thúc ca thi hoặc khi hết giờ, toàn phòng đồng loạt mở bục vinh danh (Top 1-2-3 Podium), thứ hạng cá nhân, điểm số và số câu đúng (sửa triệt để lỗi 404 "Không tìm thấy phòng thi" khi click xem kết quả).
6. **Quy chế xem đáp án theo thiết lập Giám thị:** Bổ sung cấu hình cho phép hoặc không cho phép xem đáp án; màn hình kết quả của thí sinh chỉ hiển thị nút/nội dung xem lại đáp án & giải thích chi tiết nếu Giám thị bật tùy chọn này.
7. **Cờ tin cậy (Trust score):** Hoạt động minh bạch và chuẩn xác theo cấu hình giám sát phòng thi, ghi nhận vi phạm đổi tab/mất focus, trừ điểm tin cậy và cảnh báo trực tiếp trên bảng điều khiển Giám thị.

## 2. Đối tượng thụ hưởng (User)
- **Giám thị:** Điều hành phòng thi chuyên nghiệp, phát đề mượt mà, nắm bắt chính xác độ tin cậy và thu bài/công bố kết quả một chạm.
- **Thí sinh:** Vào thi không giật lag, thưởng thức giao diện chủ đề đồng bộ đẹp mắt, biết rõ vị trí xếp hạng của mình trên bục vinh danh sau khi ca thi khép lại.

## 3. Lý do thực hiện (Why Now)
- Khắc phục tình trạng thí sinh bị trễ giờ do màn hình xoay spinner khi phát đề.
- Sửa dứt điểm lỗi 404 khi thí sinh ấn xem bảng điểm/kết quả.
- Kích hoạt thực tế 4 chủ đề giao diện vốn đã có trong cấu hình nhưng chưa áp dụng cho màn hình thi.
- Loại bỏ thao tác thừa trên thanh công cụ của Giám thị.

## 4. Tiêu chí thành công (Success)
- [ ] Chuyển trang sảnh chờ sang làm bài < 0.5s nhờ cơ chế prefetch đề thi.
- [ ] Bỏ nút "Thu bài cả phòng", nút "Kết thúc ca & Chấm điểm" thu bài tự động 100%.
- [ ] Lỗi 404 trang kết quả được sửa hoàn toàn; bục vinh danh Top 1-2-3 và xếp hạng cá nhân hiển thị chuẩn xác.
- [ ] Cài đặt `show_answers` kiểm soát được quyền xem đáp án của thí sinh.
- [ ] 4 theme hiển thị đúng bảng màu trên toàn bộ các màn hình thi.
- [ ] Cờ tin cậy trừ điểm và ghi nhận nhật ký vi phạm chính xác.
- [ ] 100% test Vitest vượt qua, 0 lỗi TypeScript.

## 5. Ràng buộc (Constraint)
- Tuân thủ quy chuẩn giao diện AGENTS.md (không viền ngang `border-t`/`border-b`, không emoji trong JSX, tương phản chuẩn WCAG AA).
- Giữ nguyên kiến trúc 3 không gian (Personal, Organization, Platform Admin) và bảo toàn tính toàn vẹn dữ liệu.

## 6. Ngoài phạm vi (Out of Scope)
- Không phân tách điểm cho 21 kỹ năng thành phần nhỏ lẻ trên giao diện người dùng.
