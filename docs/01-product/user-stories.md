# ĐẶC TẢ USER STORIES & TIÊU CHÍ CHẤPNHẬN (GHERKIN ACCEPTANCE CRITERIA)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-USER-STORIES`
- **Phiên bản:** `v3.2.0`
- **Chuẩn đặc tả:** Agile User Stories & Gherkin BDD (`Given - When - Then`)

---

## EPIC 1: KHÁCH VÃNG LAI & ĐĂNG KÝ VAI TRÒ CỐ ĐỊNH (`GUEST & AUTH`)

### `US-GST-01`: Tự đăng ký tài khoản Người học hoặc Người đánh giá cố định

- **Là một** khách vãng lai truy cập nền tảng,
- **Tôi muốn** tự chọn đăng ký tài khoản với vai trò Người học (`LEARNER`) hoặc Người đánh giá (`EVALUATOR`),
- **Để** sử dụng ngay đúng không gian chức năng phù hợp với nhu cầu cá nhân hoặc giảng dạy của mình.

```gherkin
Scenario: Khách vãng lai tự đăng ký làm Người đánh giá và vào thẳng gói Miễn phí
  Given Khách vãng lai đang ở màn hình "/register"
  When Người dùng nhập Họ tên, Email, Mật khẩu hợp lệ
  And Chọn vai trò cố định là "Người đánh giá (Evaluator)"
  And Tích chọn ô đồng ý Điều khoản bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)
  And Hoàn tất xác thực mã OTP 6 số gửi qua Email
  Then Hệ thống khởi tạo hồ sơ với vai trò tĩnh "EVALUATOR" (khóa cứng không cho đổi sang Learner)
  And Tự động kích hoạt gói "Evaluator Free"
  And Điều hướng người dùng vào thẳng "/evaluator/dashboard" để bắt đầu tạo nhóm hoặc đề thi.
```

---

## EPIC 2: TRẢI NGHIỆM NGƯỜI HỌC B2C & TRONG NHÓM (`LEARNER PORTAL`)

### `US-LEA-01`: Tham gia Nhóm hoặc Phòng thi trực tiếp qua Link, Mã PIN và QR Code

- **Là một** Người học,
- **Tôi muốn** tham gia vào nhóm lớp hoặc vào thẳng phòng thi trực tiếp bằng đường link, mã số hoặc quét mã QR (kể cả khi chưa tham gia nhóm nào),
- **Để** vào làm bài nhanh chóng tại lớp học hoặc sự kiện mà không mất nhiều thao tác phức tạp.

```gherkin
Scenario: Tham gia Phòng thi trực tiếp Mở (Open Live Room) qua đường Link hoặc Mã PIN mà không cần vào nhóm
  Given Một Người đánh giá đang mở một Phòng thi trực tiếp ở chế độ "Mở (Open Room)" với mã PIN "849201"
  When Người học (đã đăng nhập) bấm vào đường link "/learner/live-pin?pin=849201" hoặc quét mã QR phòng thi
  Then Hệ thống tự động điền mã PIN "849201" và kiểm tra phiên phòng thi trên Upstash Redis
  And Đưa Người học vào thẳng Phòng chờ thi trực tiếp mà không yêu cầu phải là thành viên của nhóm nào trước đó.

Scenario: Gia nhập Nhóm học tập qua đường Link có gắn sẵn mã nhóm
  Given Người đánh giá chia sẻ đường link mời nhóm "/learner/groups?join=K24DIG"
  When Người học bấm vào đường link trên
  Then Hệ thống tự động ghi nhận Người học vào nhóm "K24DIG"
  And Hiển thị không gian nhóm kèm danh sách bài đánh giá và mục Nhận xét từ Người đánh giá.
```

### `US-LEA-02`: Thực hiện bài đánh giá 4 hình thức (Trắc nghiệm, Tình huống, Thực hành, Minh chứng số)

- **Là một** Người học,
- **Tôi muốn** thực hiện bài đánh giá bao gồm cả câu hỏi trắc nghiệm, xử lý tình huống, bài tập thực hành và nộp sản phẩm minh chứng số trên cùng một giao diện liền mạch,
- **Để** chứng minh toàn diện cả kiến thức lẫn kỹ năng làm việc thực tế của mình.

```gherkin
Scenario: Nộp câu hỏi Sản phẩm và minh chứng số kèm giải trình phương án
  Given Người học đang ở màn hình làm bài "/learner/take/[id]" tại câu hỏi loại "DIGITAL_EVIDENCE"
  When Người học tải lên tệp sản phẩm "Bao-cao-an-toan-so.pdf" (dung lượng 4MB)
  And Nhập đoạn văn bản giải trình phương án thực hiện dài 65 từ vào ô thuyết minh
  And Bấm nút "Nộp bài đánh giá"
  Then Hệ thống lưu tệp lên Supabase Storage, ghi nhận toàn bộ câu trả lời của 4 hình thức
  And Kích hoạt chuỗi xử lý AI 2 bước để chấm điểm và phân tích năng lực.
```

### `US-LEA-03`: Nhận báo cáo 5 Ứng dụng AI & Nhận xét trực tiếp từ Người đánh giá

- **Là một** Người học vừa hoàn thành bài đánh giá,
- **Tôi muốn** xem biểu đồ Radar, điểm mạnh/điểm yếu, khoảng trống năng lực, phản hồi cá nhân hóa từ AI cùng lời nhận xét của Người đánh giá,
- **Để** hiểu rõ năng lực thực chất của mình và biết chính xác cần cải thiện điều gì.

```gherkin
Scenario: Xem kết quả phân tích AI tức thì đối với bài tự đánh giá B2C
  Given Người học tự do vừa nộp một bài đánh giá chuẩn trên nền tảng NEXA
  When Quá trình chấm điểm hoàn tất (sau 3-5 giây) và chuyển tới "/learner/results/[id]"
  Then Màn hình hiển thị đầy đủ:
    1. Điểm tổng quát, Bậc năng lực đạt được và Biểu đồ Radar 5 miền năng lực.
    2. Bảng điểm chi tiết từng tiêu chí Rubric kèm câu trích dẫn bằng chứng từ bài làm.
    3. Khối "Điểm mạnh & Điểm yếu" và danh sách "Khoảng trống năng lực (< 60%)".
    4. Bản "Phản hồi cá nhân hóa" và nút chuyển tới "Lộ trình phát triển năng lực".

Scenario: Nhận lời nhận xét trực tiếp từ Người đánh giá trong Nhóm hoặc Bài thi
  Given Người học tham gia trong nhóm của một Người đánh giá
  When Người đánh giá gửi một lời nhận xét chuyên môn cho bài làm hoặc nhận xét định kỳ trong nhóm
  Then Người học nhận được thông báo mới trên thanh Topbar
  And Xem được nguyên văn lời nhận xét, tên Người đánh giá và thời gian gửi tại "/learner/groups" và "/learner/results/[id]".
```

### `US-LEA-04`: Học theo Lộ trình phát triển năng lực 4 bước & Tích lũy điểm (point) đua Top 100+

- **Là một** Người học muốn nâng cao năng lực số,
- **Tôi muốn** học từng bài trong lộ trình cá nhân hóa do AI đề xuất và tích lũy điểm (point) trên bảng xếp hạng Top 100+,
- **Để** lấp đầy các kỹ năng còn yếu và có động lực rèn luyện mỗi ngày ngay cả khi học một mình.

```gherkin
Scenario: Hoàn thành học liệu trong Lộ trình phát triển và mở khóa Đánh giá lại kỹ năng
  Given Người học bị thiếu hụt kỹ năng "Bảo vệ dữ liệu cá nhân" (đạt 45/100 điểm)
  And AI đã sắp xếp 3 học liệu từ Kho học liệu chuẩn vào Chặng 1 tại "/learner/learning-path"
  When Người học học xong từng học liệu và bấm "Đánh dấu hoàn thành"
  Then Hệ thống cộng "+30 điểm (point)" cho mỗi học liệu hoàn thành lần đầu và cập nhật thứ hạng tại "/learner/leaderboard"
  And Khi hoàn thành đủ các học liệu của kỹ năng đó, hệ thống mở khóa nút "Đánh giá lại kỹ năng" để người học thi nâng điểm.
```

---

## EPIC 3: NGƯỜI ĐÁNH GIÁ & TỔ CHỨC KHẢO THÍ (`EVALUATOR PORTAL`)

### `US-EVA-01`: Mở phòng thi trực tiếp (Có nhóm hoặc Không nhóm) & Chấm bài cùng AI

- **Là một** Người đánh giá,
- **Tôi muốn** mở phòng thi qua Link/PIN/QR, được AI chấm sơ bộ bài thực hành kèm cờ tin cậy và gửi nhận xét cho học viên,
- **Để** tiết kiệm 80% thời gian chấm bài mà vẫn đảm bảo chất lượng phản hồi sư phạm.

```gherkin
Scenario: Thẩm định bài nộp trên Split-view Studio và gửi nhận xét cho Người học
  Given Có một bài nộp thực hành được AI chấm sơ bộ với "confidenceScore = 0.78" (Cờ Cam)
  When Người đánh giá mở bài nộp tại "/evaluator/grading"
  Then Cột trái hiển thị tệp sản phẩm PDF và đoạn văn giải trình của người học
  And Cột phải hiển thị điểm gợi ý của AI, câu trích dẫn bằng chứng và ô nhập nhận xét của Người đánh giá
  When Người đánh giá điều chỉnh điểm, viết lời khuyên chuyên môn và bấm "Phê duyệt & Gửi nhận xét"
  Then Điểm số chính thức và lời nhận xét được công bố ngay tới Dashboard của Người học.
```

### `US-EVA-02`: Xuất dữ liệu phân tích khảo thí của Nhóm lớp

- **Là một** Người đánh giá,
- **Tôi muốn** xem Bản đồ nhiệt kỹ năng của cả lớp và xuất toàn bộ bảng điểm chi tiết ra tệp Excel/CSV,
- **Để** báo cáo kết quả đào tạo hoặc lưu trữ hồ sơ điểm số.

```gherkin
Scenario: Xuất bảng dữ liệu khảo thí nhóm ra tệp Excel/CSV
  Given Người đánh giá đang ở trang "/evaluator/analytics" và chọn một nhóm học viên
  When Người đánh giá bấm nút "Xuất dữ liệu (Excel / CSV)"
  Then Hệ thống tải xuống tệp dữ liệu chứa danh sách thành viên, điểm tổng, điểm từng miền năng lực, điểm từng kỹ năng, thời gian làm bài và nhận xét.
```

---

## EPIC 4: CHỦ NỀN TẢNG QUẢN TRỊ HỆ THỐNG (`SUPER ADMIN PORTAL`)

### `US-ADM-01`: Tùy biến Khung năng lực số động & Chuyển đổi mô hình AI

- **Là** Chủ sở hữu nền tảng (Admin),
- **Tôi muốn** cập nhật các miền năng lực/kỹ năng khi tiêu chuẩn thay đổi và tùy ý chuyển đổi nhà cung cấp AI (Gemini, OpenAI, Claude),
- **Để** hệ thống luôn thích ứng với tiêu chuẩn mới và tối ưu chi phí vận hành.

```gherkin
Scenario: Cập nhật phiên bản Khung năng lực số mới không làm hỏng dữ liệu cũ
  Given Admin đang ở màn hình "/admin/framework-engine"
  When Admin tạo một phiên bản khung năng lực mới, thêm kỹ năng mới và đặt trạng thái "ACTIVE"
  Then Các đề đánh giá tạo mới sẽ sử dụng danh sách miền và kỹ năng của phiên bản mới
  And Toàn bộ kết quả bài thi và chứng chỉ cũ vẫn giữ nguyên tham chiếu tới phiên bản khung tại thời điểm thi.
```

### `US-ADM-02`: Xuất Bộ dữ liệu Nghiên cứu ẩn danh (Research Dataset Export)

- **Là** Chủ sở hữu nền tảng (Admin),
- **Tôi muốn** xuất toàn bộ dữ liệu khảo thí và lộ trình học tập đã khử thông tin định danh cá nhân ra tệp CSV/Excel,
- **Để** phục vụ phân tích thống kê, kiểm định độ tin cậy thang đo và nghiên cứu khoa học (SPSS, R, Python).

```gherkin
Scenario: Xuất bộ dữ liệu nghiên cứu đã ẩn danh hóa PII
  Given Admin đang ở màn hình "/admin/analytics"
  When Admin chọn khoảng thời gian, chọn các biến số cần xuất và bấm "Xuất Dữ liệu Nghiên cứu (CSV)"
  Then Hệ thống xuất tệp CSV gồm mã định danh ẩn danh (Hash ID), điểm 4 hình thức câu hỏi, điểm các miền và kỹ năng, độ khó câu hỏi (P), độ phân biệt (D), và điểm trước/sau khi học lộ trình (Pre/Post-test).
```
