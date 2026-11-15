# Danh Sách Nhiệm Vụ Triển Khai: Hoàn Thiện Luồng Live Exam, 0s Delay, Bục Vinh Danh & Themes

## Giai đoạn 1: Sửa Lỗi 404 Trang Kết Quả & Cơ Chế Xem Đáp Án (`show_answers`)

- [x] **Task 1.1: Sửa lỗi 404 trang kết quả (`/api/rooms/[id]/results`) bằng Admin Client an toàn**
  - **Mô tả:** Khi phòng thi kết thúc (`is_active = FALSE`), chính sách RLS của Supabase chặn thí sinh truy vấn bảng `exam_rooms` dẫn đến lỗi 404 "Không tìm thấy phòng thi". Sửa API kết quả bằng cách xác thực user hiện tại qua `supabase.auth.getUser()`, sau đó dùng `createAdminClient()` để kiểm tra quyền: user phải là Host hoặc là thí sinh trong `room_participants` của phòng thi đó. Nếu chưa công bố kết quả (`results_published = false`) và không phải Host thì trả về 403 `RESULTS_NOT_PUBLISHED`; nếu đã công bố hoặc là Host thì trả về đầy đủ kết quả phòng thi.
  - **Tiêu chí nghiệm thu:**
    - [x] Thí sinh (không phải Host) truy cập `/api/rooms/[id]/results` của phòng đã kết thúc nhận được kết quả thành công HTTP 200 (không còn lỗi 404).
    - [x] Người dùng lạ không tham gia phòng thi truy cập API bị từ chối quyền truy cập (403/404).
    - [x] Trang `/personal/live-room/[id]/results` hiển thị thông tin phòng thi và bảng điểm cho thí sinh.
  - **Kiểm tra:**
    - [x] Gọi API với tài khoản thí sinh đã thi -> trả về mã 200 kèm danh sách kết quả.
    - [x] Mở trang kết quả trên trình duyệt không còn hiển thị card đỏ "Không tìm thấy phòng thi".
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/api/rooms/[id]/results/route.ts`, `src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`
  - **Quy mô:** Vừa (2 tệp)

- [x] **Task 1.2: Bổ sung cấu hình & cơ chế xem đáp án chi tiết (`show_answers`) ở cả Backend và Frontend**
  - **Mô tả:** Thêm thiết lập quy chế cho phép Giám thị quyết định thí sinh có được xem lại đáp án và giải thích chi tiết sau ca thi hay không. Cập nhật `results_publish_settings.show_answers` từ Giám thị. Khi `show_answers: true`, API trả về dữ liệu câu hỏi kèm đáp án đúng cho bài làm của thí sinh (`userReviewItems`), và trang kết quả hiển thị khối xem lại câu hỏi bằng component `QuestionReviewSection`. Khi `show_answers: false`, ẩn hoàn toàn đáp án đúng.
  - **Tiêu chí nghiệm thu:**
    - [x] Giám thị có toggle switch "Cho phép xem đáp án & giải thích sau ca thi" trong sảnh chờ (`/live/control`) và trang kết quả (`/personal/live-room/[id]/results`).
    - [x] API `/api/rooms/[id]/results` chỉ trả về đáp án đúng và giải thích khi `show_answers === true` (hoặc với Host).
    - [x] Thí sinh thấy nút/khối "Xem lại đáp án & giải thích chi tiết" khi được Host cho phép, và thấy thông báo "Chưa mở xem đáp án" khi Host tắt tùy chọn.
  - **Kiểm tra:**
    - [x] Bật `show_answers` -> thí sinh mở xem được từng câu hỏi với đáp án đúng và giải thích.
    - [x] Tắt `show_answers` -> payload API không lộ đáp án đúng, UI không hiển thị lời giải.
  - **Phụ thuộc:** Task 1.1
  - **Tệp liên quan:** `src/app/api/rooms/[id]/results/route.ts`, `src/app/live/control/page.tsx`, `src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`
  - **Quy mô:** Vừa (3 tệp)

## Checkpoint 1: Kết Quả & Quyền Xem Đáp Án Hoạt Động Chuẩn Xác
- [x] Lỗi 404 trang kết quả được khắc phục hoàn toàn.
- [x] Thí sinh xem được bảng điểm và xem đáp án đúng quy chế của Host.

---

## Giai đoạn 2: Tự Động Thu Toàn Bộ Bài Làm Khi Kết Thúc Ca Thi

- [x] **Task 2.1: Loại bỏ nút "Thu bài cả phòng" thừa trên thanh điều hướng Giám thị**
  - **Mô tả:** Loại bỏ nút "Thu bài cả phòng" (Download icon) tại dòng 1113-1117 trong `src/app/live/control/page.tsx` để giao diện Giám thị tinh gọn, chỉ duy trì 1 nút hành động dứt khoát màu đỏ "Kết thúc ca & Chấm điểm".
  - **Tiêu chí nghiệm thu:**
    - [x] Thanh topbar của Giám thị không còn nút "Thu bài cả phòng".
    - [x] Bố cục topbar cân đối, thoáng đãng, tuân thủ đúng yêu cầu người dùng.
  - **Kiểm tra:**
    - [x] Quan sát thanh điều hướng Giám thị chỉ còn nút "Kết thúc ca & Chấm điểm" và nút "Tạm khóa phòng".
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/live/control/page.tsx`
  - **Quy mô:** Nhỏ (1 tệp)

- [x] **Task 2.2: Tự động thu toàn bộ bài làm, cập nhật điểm và phát sóng kết thúc ca thi khi Host bấm kết thúc hoặc hết giờ**
  - **Mô tả:** Trong `src/app/api/evaluator/rooms/route.ts` với action `END`: tự động cập nhật tất cả thí sinh đang ở trạng thái `TAKING` hoặc `JOINED` thành `SUBMITTED`, cập nhật `results_published: true` và `status: 'RESULTS_PUBLISHED'`. Đồng thời phát Supabase Broadcast sự kiện `RESULTS_PUBLISHED` và `ROOM_STATE_CHANGE` (action: `EXAM_ENDED`) để toàn phòng thi cùng đồng bộ chuyển sang màn hình kết quả chung cuộc.
  - **Tiêu chí nghiệm thu:**
    - [x] Khi bấm "Kết thúc ca & Chấm điểm", toàn bộ thí sinh trong phòng tự động được chuyển sang trạng thái `SUBMITTED`.
    - [x] Phòng thi tự động cập nhật `results_published = true`.
    - [x] Realtime broadcast gửi tín hiệu tức thì đến tất cả thí sinh đang mở bài thi hoặc sảnh nộp bài.
  - **Kiểm tra:**
    - [x] Thử nghiệm với 1 thí sinh đang làm bài dở, Host bấm kết thúc ca -> thí sinh tự động nộp bài và chuyển sang màn hình vinh danh.
  - **Phụ thuộc:** Task 2.1
  - **Tệp liên quan:** `src/app/api/evaluator/rooms/route.ts`, `src/app/live/control/page.tsx`
  - **Quy mô:** Vừa (2 tệp)

## Checkpoint 2: Kết Thúc Ca Thi Liền Mạch & An Toàn
- [x] Topbar Giám thị sạch sẽ, không nút thừa.
- [x] Kết thúc ca thi thu bài tự động 100% và mở khóa kết quả toàn phòng.

---

## Giai đoạn 3: Prefetch Đề Thi Ngầm Tại Sảnh Chờ (0s Delay Phát Đề)

- [x] **Task 3.1: Gọi prefetch dữ liệu câu hỏi ngầm ngay khi thí sinh ngồi ở sảnh chờ (`/live/waiting-room`)**
  - **Mô tả:** Trong `src/app/live/waiting-room/page.tsx`, khi `room.assessmentId` đã sẵn sàng, thực hiện gọi ngầm `fetch('/api/assessments/' + room.assessmentId + '?roomId=' + room.id + '&pin=' + room.roomCode)` và lưu cache vào `sessionStorage` dưới key `prefetched_assessment_${room.assessmentId}_${room.id}`. Xóa màn hình chữ `!` khổng lồ khi đếm ngược kết thúc để chuyển thẳng sang làm bài.
  - **Tiêu chí nghiệm thu:**
    - [x] Dữ liệu đề thi được tải ngầm về trình duyệt ngay khi thí sinh đang đợi ở phòng chờ.
    - [x] Cache được lưu trữ an toàn trong `sessionStorage` và không gây giật lag giao diện phòng chờ.
    - [x] Khi Host phát đề (0s hoặc sau đếm ngược), sảnh chờ chuyển hướng mượt mà, không dừng lại ở màn hình `!`.
  - **Kiểm tra:**
    - [x] Kiểm tra tab Application -> Session Storage trong DevTools có bản ghi dữ liệu đề thi đã tải trước.
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/live/waiting-room/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 3.2: Đọc dữ liệu từ cache `sessionStorage` trong màn hình làm bài (`take/[id]`) để mở đề tức thì (0s delay)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/take/[id]/page.tsx`, kiểm tra dữ liệu trong `sessionStorage` trước khi kích hoạt `setLoading(true)`. Nếu có dữ liệu đã prefetch, nạp danh sách câu hỏi và cấu hình vào state ngay lập tức, hiển thị Câu 1 với thời gian trễ = 0s. Đồng thời đồng bộ thời gian làm bài chính xác theo `roomData.room.startedAt` hoặc thời gian phòng thi.
  - **Tiêu chí nghiệm thu:**
    - [x] Thí sinh vào trang làm bài từ phòng thi trực tiếp thấy ngay câu hỏi đầu tiên mà không phải đợi spinner "Đang chuẩn bị câu hỏi khảo thí...".
    - [x] Thời gian đếm ngược làm bài được tính chuẩn xác theo đồng hồ phòng thi (Host / Server wall-clock), không bị lệch do mạng.
  - **Kiểm tra:**
    - [x] Bấm phát đề từ Giám thị -> trang làm bài của thí sinh render câu hỏi ngay lập tức (<0.3s).
  - **Phụ thuộc:** Task 3.1
  - **Tệp liên quan:** `src/app/(dashboard)/personal/take/[id]/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

## Checkpoint 3: Trải Nghiệm Mở Đề Mượt Mà, Không Giật Lag
- [x] Chuyển từ sảnh chờ sang làm bài diễn ra tức khắc (0s delay).
- [x] Đồng hồ đếm ngược phòng thi đồng bộ chính xác trên mọi thiết bị.

---

## Giai đoạn 4: Áp Dụng 4 Chủ Đề Giao Diện (Themes) Toàn Diện

- [x] **Task 4.1: Đồng bộ Theme tại Sảnh chờ thí sinh (`/live/waiting-room`) và Máy chiếu (`/live/projector`) theo Realtime**
  - **Mô tả:** Bổ sung xử lý nhận và áp dụng giao diện theo 4 theme (`minimal_white`, `space_blue`, `aurora`, `dark_professional`) cho sảnh chờ thí sinh và màn hình máy chiếu. Lắng nghe sự kiện `THEME_UPDATE` qua kênh Supabase Broadcast để đổi giao diện theo thời gian thực khi Giám thị chọn theme.
  - **Tiêu chí nghiệm thu:**
    - [x] Sảnh chờ thí sinh và máy chiếu đổi màu nền và phong cách tương ứng với từng theme đã chọn.
    - [x] Giám thị click chọn theme ở `/live/control` -> màn hình sảnh chờ thí sinh và máy chiếu đổi màu ngay lập tức.
  - **Kiểm tra:**
    - [x] Thử chọn lần lượt cả 4 theme tại Host -> sảnh chờ phản hồi đổi giao diện tức thì.
  - **Phụ thuộc:** Không có
  - **Tệp liên quan:** `src/app/live/waiting-room/page.tsx`, `src/app/live/projector/page.tsx`
  - **Quy mô:** Vừa (2 tệp)

- [x] **Task 4.2: Đồng bộ Theme tại Màn hình làm bài (`take/[id]`), Màn hình nộp bài (`submitted`) và Trang kết quả (`results`)**
  - **Mô tả:** Đọc `themeId` từ room data hoặc query param và áp dụng lớp giao diện theme phù hợp cho màn hình làm bài (`take/[id]`), màn hình nộp bài (`submitted`) và trang kết quả (`results`), bảo đảm trải nghiệm thẩm mỹ xuyên suốt buổi thi. Tuân thủ nghiêm ngặt quy định không dùng đường viền ngang và chữ trung tính.
  - **Tiêu chí nghiệm thu:**
    - [x] Màn hình làm bài thi hiển thị đúng bảng màu của theme ca thi.
    - [x] Màn hình nộp bài (`/live/submitted`) và trang kết quả (`/results`) hiển thị đồng bộ với theme đã chọn.
    - [x] Tuân thủ WCAG AA về tương phản chữ, không dùng emoji trong JSX.
  - **Kiểm tra:**
    - [x] Tạo phòng thi với theme `space_blue` hoặc `dark_professional`, đi hết luồng từ làm bài đến kết quả -> tất cả màn hình giữ đúng tông theme.
  - **Phụ thuộc:** Task 4.1
  - **Tệp liên quan:** `src/app/(dashboard)/personal/take/[id]/page.tsx`, `src/app/live/submitted/page.tsx`, `src/app/(dashboard)/personal/live-room/[id]/results/page.tsx`
  - **Quy mô:** Vừa (3 tệp)

## Checkpoint 4: Giao Diện Chủ Đề Đẹp Mắt & Thống Nhất
- [x] 4 theme hoạt động chuẩn xác và trực quan trên toàn bộ 5 màn hình.
- [x] Không còn tình trạng "chọn theme nhưng vẫn màu trắng".

---

## Giai đoạn 5: Bục Vinh Danh Podium Top 1-2-3 & Cờ Tin Cậy Giám Sát

- [x] **Task 5.1: Mở khóa tức thì Bục vinh danh và Xếp hạng cá nhân trên màn hình Thí sinh (`/live/submitted`)**
  - **Mô tả:** Trong `src/app/live/submitted/page.tsx`, khi nhận broadcast `RESULTS_PUBLISHED` hoặc khi polling thấy ca thi đã kết thúc/công bố kết quả, gọi API kết quả (đã hết 404) để lấy dữ liệu xếp hạng. Tự động hiển thị Bục vinh danh Podium Top 3 (dùng icon `Crown`, `Medal`, `Award` từ `lucide-react`), hiển thị thẻ thứ hạng cá nhân (`Hạng #... / ...`), và mở khóa nút "Xem bảng điểm".
  - **Tiêu chí nghiệm thu:**
    - [x] Khi Host kết thúc ca thi, màn hình nộp bài của thí sinh tự động mở Bục vinh danh Top 1, 2, 3 và thứ hạng cá nhân mà không cần F5.
    - [x] Nút "Xem bảng điểm" được mở khóa và dẫn đến trang kết quả hoạt động chuẩn xác.
    - [x] Thí sinh biết rõ điểm số và thứ hạng của mình trong phòng.
  - **Kiểm tra:**
    - [x] Host bấm kết thúc -> tab thí sinh chuyển sang hiển thị Podium Top 3 và vị trí xếp hạng của mình.
  - **Phụ thuộc:** Checkpoint 1, Checkpoint 2
  - **Tệp liên quan:** `src/app/live/submitted/page.tsx`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 5.2: Hoàn thiện hiển thị Cờ tin cậy (Trust score) và Cảnh báo vi phạm trên Dashboard Giám thị**
  - **Mô tả:** Đảm bảo tính năng Cờ tin cậy hoạt động rõ ràng: khi Giám thị bật tùy chọn "Cảnh báo rời tab làm bài" trong sảnh chờ, thí sinh đổi tab làm bài sẽ bị kích hoạt cảnh báo, trừ điểm tin cậy (-10 điểm/lần), gửi sự kiện realtime `TAB_SWITCH_ALERT` và cập nhật trực tiếp huy hiệu độ tin cậy trên danh sách thí sinh của Giám thị.
  - **Tiêu chí nghiệm thu:**
    - [x] Khi bật giám sát tab, thí sinh chuyển tab bị trừ điểm tin cậy và hiển thị cảnh báo.
    - [x] Màn hình Giám thị hiển thị số lần vi phạm và cờ tin cậy của từng thí sinh theo thời gian thực.
    - [x] Khi tắt giám sát tab, thí sinh chuyển tab không bị cảnh báo và không ghi nhận vi phạm.
  - **Kiểm tra:**
    - [x] Bật giám sát tab, thí sinh đổi tab -> Giám thị thấy cảnh báo xuất hiện trong danh sách vi phạm.
  - **Phụ thuộc:** Task 1.2
  - **Tệp liên quan:** `src/app/(dashboard)/personal/take/[id]/page.tsx`, `src/app/live/control/page.tsx`, `src/app/api/rooms/events/route.ts`
  - **Quy mô:** Vừa (2 tệp)

## Checkpoint 5: Vinh Danh & Giám Sát Hoàn Chỉnh
- [x] Bục vinh danh và thứ hạng cá nhân hiển thị trọn vẹn.
- [x] Cờ tin cậy và giám sát đổi tab hoạt động minh bạch, chuẩn xác.

---

## Giai đoạn 6: Kiểm Thử Toàn Diện & Thẩm Định Hệ Thống

- [x] **Task 6.1: Viết test TDD Vitest cho các tính năng mới**
  - **Mô tả:** Bổ sung các ca kiểm thử trong `tests/challenger-m5-live-room-tdd.test.ts`:
    - Kiểm thử prefetch cache logic của đề thi.
    - Kiểm thử phân quyền kết quả qua Admin client cho thí sinh và chặn người ngoài.
    - Kiểm thử cơ chế auto-submit tất cả thí sinh khi kết thúc ca thi.
    - Kiểm thử ẩn/hiện đáp án chi tiết theo cờ `show_answers`.
    - Kiểm thử các giá trị theme trong cấu hình phòng thi.
  - **Tiêu chí nghiệm thu:**
    - [x] Toàn bộ các test cases mới đều PASS 100%.
  - **Kiểm tra:**
    - [x] Chạy `npx vitest run tests/challenger-m5-live-room-tdd.test.ts`.
  - **Phụ thuộc:** Giai đoạn 1 đến Giai đoạn 5
  - **Tệp liên quan:** `tests/challenger-m5-live-room-tdd.test.ts`
  - **Quy mô:** Vừa (1 tệp)

- [x] **Task 6.2: Kiểm tra TypeScript (`npm run typecheck`), chạy toàn bộ test suite (`npx vitest run`)**
  - **Mô tả:** Kiểm tra độ an toàn kiểu TypeScript toàn dự án và chạy toàn bộ hơn 1.446 tests của hệ thống, bảo đảm không có hồi quy và tuân thủ quy tắc AGENTS.md (không emoji, không viền ngang).
  - **Tiêu chí nghiệm thu:**
    - [x] `npm run typecheck` đạt 0 lỗi (clean).
    - [x] 92+ test suites tiếp tục PASS 100%.
  - **Kiểm tra:**
    - [x] Chạy `npm run typecheck` và `npx vitest run`.
  - **Phụ thuộc:** Task 6.1
  - **Tệp liên quan:** Toàn bộ hệ thống
  - **Quy mô:** Nhỏ
