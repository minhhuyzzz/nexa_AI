# Kế Hoạch Triển Khai: Hoàn Thiện Luồng Live Exam, 0s Delay, Bục Vinh Danh & Themes

## 1. Tổng Quan (Overview)
Kế hoạch này giải quyết triệt để 7 yêu cầu đã chốt trong `docs/intent/live-exam-flow-and-results.md` về trải nghiệm phòng thi trực tiếp (Live Exam) của nền tảng NEXA AI:
1. **0s Delay khi phát đề:** Tải trước (prefetch) đề thi ngầm trong lúc thí sinh đợi ở sảnh chờ (`/live/waiting-room`), lưu trữ `sessionStorage` để khi vào màn hình làm bài (`/personal/take/[id]`) câu hỏi hiển thị tức thì, không bị xoay spinner "Đang chuẩn bị câu hỏi...".
2. **Sửa lỗi 404 trang kết quả:** Thay thế truy vấn trực tiếp bị chặn bởi RLS của `exam_rooms` khi phòng đã kết thúc (`is_active = FALSE`) bằng cơ chế `createAdminClient()` có kiểm tra bảo mật (User phải là Host hoặc Participant).
3. **Bục vinh danh Podium & Xếp hạng cá nhân:** Tự động mở bục vinh danh Top 1, 2, 3 và thứ hạng cá nhân trên màn hình Thí sinh (`/live/submitted`) ngay khi Host bấm "Kết thúc ca & Chấm điểm" hoặc khi hết giờ.
4. **Tinh gọn điều khiển Giám thị:** Loại bỏ nút "Thu bài cả phòng" thừa trên topbar; nút "Kết thúc ca & Chấm điểm" tự động thu bài toàn bộ thí sinh, lưu đáp án và chốt điểm.
5. **Cấu hình xem đáp án & giải thích (`show_answers`):** Thêm toggle quy chế cho Host; thí sinh chỉ xem được lời giải chi tiết tại trang kết quả nếu Host bật tùy chọn này.
6. **Kích hoạt 4 chủ đề giao diện (Themes):** Đồng bộ thực tế 4 theme (*Trắng tối giản, Space Blue, Cyber Aurora, Dark Professional*) xuyên suốt tất cả các màn hình: Sảnh chờ, Máy chiếu, Màn hình làm bài, Màn hình nộp bài và Trang kết quả.
7. **Cờ tin cậy (Trust score):** Hoạt động minh bạch khi bật giám sát tab, trừ điểm và hiển thị chính xác trên dashboard Giám thị.

---

## 2. Quyết Định Kiến Trúc (Architecture Decisions)

1. **Khắc phục lỗi 404 trang kết quả qua Admin Client an toàn:**
   - Trong `src/app/api/rooms/[id]/results/route.ts`: API cần lấy thông tin phòng thi kể cả khi `is_active = FALSE`.
   - Vì bảng `exam_rooms` có chính sách RLS `USING (is_active = TRUE OR created_by = auth.uid())`, thí sinh thông thường sẽ bị RLS lọc bỏ khi phòng kết thúc.
   - Giải pháp: Xác thực danh tính qua `supabase.auth.getUser()`, sau đó sử dụng `createAdminClient()` để đọc phòng thi và kiểm tra: `user.id === room.created_by` HOẶC tồn tại bản ghi trong `room_participants` với `room_id = roomId AND user_id = user.id`. Nếu ca thi chưa công bố (`results_published = false`) và người gọi không phải Host -> trả về HTTP 403 `RESULTS_NOT_PUBLISHED`. Nếu đã công bố hoặc là Host -> trả về kết quả đầy đủ.

2. **Cơ chế Prefetch đề thi 0s Delay:**
   - Trong `src/app/live/waiting-room/page.tsx`: Ngay khi `room.assessmentId` đã xác định, thực hiện gọi ngầm `fetch('/api/assessments/' + room.assessmentId + '?roomId=' + room.id + '&pin=' + room.roomCode)` và lưu payload vào `sessionStorage.setItem('prefetched_assessment_' + room.assessmentId, JSON.stringify(data))`.
   - Trong `src/app/(dashboard)/personal/take/[id]/page.tsx`: Kiểm tra `sessionStorage.getItem('prefetched_assessment_' + effectiveId)`. Nếu có, khởi tạo state câu hỏi ngay lập tức và đặt `loading = false` ngay từ lần render đầu tiên, loại bỏ hoàn toàn màn hình chờ xoay vòng.

3. **Tự động Thu bài & Công bố kết quả một chạm:**
   - Bỏ nút "Thu bài cả phòng" tại dòng 1113 `src/app/live/control/page.tsx`.
   - Trong API `src/app/api/evaluator/rooms/route.ts` với action `END`: Tự động cập nhật tất cả thí sinh đang `TAKING` hoặc `JOINED` thành `SUBMITTED`, cập nhật `results_published: true`, `status: 'RESULTS_PUBLISHED'`.
   - Broadcast sự kiện `RESULTS_PUBLISHED` và `ROOM_STATE_CHANGE` để màn hình Thí sinh `/live/submitted` lập tức bung mở Bục vinh danh Podium Top 3 và hiển thị thứ hạng cá nhân mà không cần tải lại trang.

4. **Kiểm soát quyền xem đáp án (`show_answers`):**
   - Thêm nút gạt Switch "Cho phép xem đáp án & giải thích sau ca thi" trong mục Cài đặt khảo thí & Quy chế của Host (`/live/control`).
   - Lưu vào `results_publish_settings.show_answers`.
   - Trong `/api/rooms/[id]/results/route.ts`: Nếu `show_answers === true`, trả về dữ liệu câu hỏi, đáp án đúng và lời giải cho thí sinh; nếu `false`, ẩn hoàn toàn đáp án đúng.
   - Tại `/personal/live-room/[id]/results/page.tsx`: Sử dụng `QuestionReviewSection` để hiển thị lời giải chi tiết khi được phép.

5. **Bộ Token CSS và Áp dụng 4 Theme toàn diện:**
   - 4 Theme: `minimal_white` (Trắng tối giản), `space_blue` (Xanh không gian sâu), `aurora` (Cyber Aurora tím/ngọc), `dark_professional` (Đen carbon IT).
   - Thiết lập wrapper theme class cho các trang: Sảnh chờ (`waiting-room`), Màn chiếu (`projector`), Làm bài (`take/[id]`), Nộp bài (`submitted`), Kết quả (`results`).
   - Sảnh chờ thí sinh lắng nghe realtime sự kiện `THEME_UPDATE` từ Host để đổi theme ngay lập tức khi Host đổi lựa chọn.

---

## 3. Danh Sách Nhiệm Vụ (Task List)

### Giai đoạn 1: Sửa Lỗi 404 Trang Kết Quả & Cơ Chế Xem Đáp Án (`show_answers`)
- [ ] Task 1.1: Sửa lỗi 404 trang kết quả (`/api/rooms/[id]/results`) bằng Admin Client an toàn
- [ ] Task 1.2: Bổ sung cấu hình & cơ chế xem đáp án chi tiết (`show_answers`) ở cả Backend và Frontend

### Checkpoint 1: Kết Quả & Quyền Xem Đáp Án Hoạt Động Chuẩn Xác
- [ ] Thí sinh bấm "Xem bảng điểm" không còn bị lỗi 404 "Không tìm thấy phòng thi".
- [ ] Tùy chọn `show_answers` kiểm soát chính xác việc ẩn/hiện giải thích chi tiết câu hỏi.

### Giai đoạn 2: Tự Động Thu Toàn Bộ Bài Làm Khi Kết Thúc Ca Thi
- [ ] Task 2.1: Loại bỏ nút "Thu bài cả phòng" thừa trên thanh điều hướng Giám thị
- [ ] Task 2.2: Tự động thu toàn bộ bài làm, cập nhật điểm và phát sóng kết thúc ca thi khi Host bấm kết thúc hoặc hết giờ

### Checkpoint 2: Kết Thúc Ca Thi Liền Mạch & An Toàn
- [ ] Nút "Thu bài cả phòng" đã được dọn sạch, topbar Giám thị tinh gọn.
- [ ] Bấm "Kết thúc ca & Chấm điểm" tự động chốt bài của mọi thí sinh và phát broadcast công bố kết quả.

### Giai đoạn 3: Prefetch Đề Thi Ngầm Tại Sảnh Chờ (0s Delay Phát Đề)
- [ ] Task 3.1: Gọi prefetch dữ liệu câu hỏi ngầm ngay khi thí sinh ngồi ở sảnh chờ (`/live/waiting-room`)
- [ ] Task 3.2: Đọc dữ liệu từ cache `sessionStorage` trong màn hình làm bài (`take/[id]`) để mở đề tức thì (0s delay)

### Checkpoint 3: Trải Nghiệm Mở Đề Mượt Mà, Không Giật Lag
- [ ] Thí sinh chuyển từ sảnh chờ vào làm bài tức thì < 0.5s, không còn thấy spinner xoay "Đang chuẩn bị câu hỏi khảo thí...".

### Giai đoạn 4: Áp Dụng 4 Chủ Đề Giao Diện (Themes) Toàn Diện
- [ ] Task 4.1: Đồng bộ Theme tại Sảnh chờ thí sinh (`/live/waiting-room`) và Máy chiếu (`/live/projector`) theo Realtime
- [ ] Task 4.2: Đồng bộ Theme tại Màn hình làm bài (`take/[id]`), Màn hình nộp bài (`submitted`) và Trang kết quả (`results`)

### Checkpoint 4: Giao Diện Chủ Đề Đẹp Mắt & Thống Nhất
- [ ] Đổi theme ở Giám thị lập tức chuyển màu sảnh chờ thí sinh và màn chiếu.
- [ ] 4 theme hiển thị đồng bộ chuẩn xác trên cả 5 màn hình của buổi thi.

### Giai đoạn 5: Bục Vinh Danh Podium Top 1-2-3 & Cờ Tin Cậy Giám Sát
- [ ] Task 5.1: Mở khóa tức thì Bục vinh danh và Xếp hạng cá nhân trên màn hình Thí sinh (`/live/submitted`)
- [ ] Task 5.2: Hoàn thiện hiển thị Cờ tin cậy (Trust score) và Cảnh báo vi phạm trên Dashboard Giám thị

### Giai đoạn 6: Kiểm Thử Toàn Diện & Thẩm Định Hệ Thống
- [ ] Task 6.1: Viết test TDD Vitest cho các tính năng mới
- [ ] Task 6.2: Kiểm tra TypeScript (`npm run typecheck`), chạy toàn bộ test suite (`npx vitest run`)

---

## 4. Quản Trị Rủi Ro (Risks & Mitigations)
| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| --- | --- | --- |
| Lạm dụng Admin Client gây rò rỉ dữ liệu phòng thi khác | Cao | Luôn xác thực session `getUser()` trước; kiểm tra chặt chẽ user có phải là Host hoặc có trong `room_participants` của đúng `roomId` đó không. |
| Cache sessionStorage bị stale nếu Host đổi đề thi vào phút chót | Trung bình | Khóa key cache theo `prefetched_assessment_${assessmentId}_${roomId}` và xóa cache khi ca thi kết thúc hoặc rời phòng. |
| Giao diện Theme tối gây giảm độ tương phản trên màn hình làm bài | Thấp | Kiểm tra độ tương phản theo chuẩn WCAG AA; dùng token màu chuẩn đã quy định trong `AGENTS.md`. |
| Vi phạm quy tắc AGENTS.md về emoji trong JSX | Cao | Sử dụng 100% icon từ thư viện `lucide-react` (`Crown`, `Trophy`, `Medal`, `Award`), tuyệt đối không render emoji. |
